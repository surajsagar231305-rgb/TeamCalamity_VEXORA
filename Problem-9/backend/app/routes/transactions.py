import os
import uuid
import shutil
import csv
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc
from app.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse
)
from app.services.export import generate_transactions_csv
from app.services.invoice_scanner import scan_and_extract_invoice
from app.routes.accounts import sync_account_balance

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

def build_transaction_query(
    db: Session,
    search: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    query = db.query(Transaction).join(Transaction.category).join(Transaction.account)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.title.ilike(s_term),
                Transaction.notes.ilike(s_term),
                Transaction.policy_name.ilike(s_term),
                Category.name.ilike(s_term),
                Account.name.ilike(s_term)
            )
        )

    if type and type in ["Income", "Expense"]:
        query = query.filter(Transaction.type == type)

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    if payment_method and payment_method != "All":
        query = query.filter(Transaction.payment_method == payment_method)

    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date.replace("Z", ""))
            query = query.filter(Transaction.date >= dt_start)
        except Exception:
            pass

    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date.replace("Z", ""))
            query = query.filter(Transaction.date <= dt_end)
        except Exception:
            pass

    return query

@router.get("")
def get_transactions(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("id", pattern="^(id|date|amount|title|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = build_transaction_query(
        db, search, type, category_id, account_id, payment_method, start_date, end_date
    )
    total_count = query.count()

    if sort_by in ["id", "created_at"]:
        query = query.order_by(desc(Transaction.id)) if sort_order == "desc" else query.order_by(asc(Transaction.id))
    else:
        sort_col = getattr(Transaction, sort_by, Transaction.date)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col), desc(Transaction.id))
        else:
            query = query.order_by(asc(sort_col), asc(Transaction.id))

    transactions = query.options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "items": [TransactionResponse.from_orm(t) for t in transactions],
        "limit": limit,
        "offset": offset
    }

@router.get("/export/csv")
def export_transactions_csv(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db)
):
    query = build_transaction_query(
        db, search, type, category_id, account_id, payment_method, start_date, end_date
    )
    if sort_by in ["id", "created_at"]:
        query = query.order_by(desc(Transaction.id)) if sort_order == "desc" else query.order_by(asc(Transaction.id))
    else:
        sort_col = getattr(Transaction, sort_by, Transaction.date)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col), desc(Transaction.id))
        else:
            query = query.order_by(asc(sort_col), asc(Transaction.id))

    transactions = query.options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).all()

    csv_data = generate_transactions_csv(transactions)
    filename = f"transactions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.post("/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    # Validate extension
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only image files (.jpg, .jpeg, .png, .webp) or PDFs are allowed.")

    safe_name = f"receipt_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(UPLOADS_DIR, safe_name)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/{safe_name}",
        "filename": safe_name,
        "original_name": file.filename
    }

@router.post("/scan-invoice")
async def scan_invoice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail="Only image files (.jpg, .jpeg, .png, .webp) can be analyzed by AI Invoice Scanner."
        )

    safe_name = f"invoice_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(UPLOADS_DIR, safe_name)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    receipt_url = f"/uploads/{safe_name}"
    extracted_data = await scan_and_extract_invoice(target_path, db, receipt_url)
    return extracted_data

@router.post("/import-csv")
async def import_transactions_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import up to 5,000 transactions from an exported or template CSV."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    raw_data = await file.read()
    try:
        text = raw_data.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc

    required_columns = {"Date", "Title", "Amount", "Type", "Category", "Payment Method", "Account"}
    headers = set(reader.fieldnames or [])
    missing = sorted(required_columns - headers)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing CSV columns: {', '.join(missing)}")

    categories = {category.name.casefold(): category for category in db.query(Category).all()}
    accounts = {account.name.casefold(): account for account in db.query(Account).all()}
    existing_keys = {
        (tx.title.casefold(), round(tx.amount, 2), tx.date.isoformat(), tx.account_id)
        for tx in db.query(Transaction).all()
    }
    imported = 0
    skipped = 0
    errors = []
    pending = []

    for row_number, row in enumerate(reader, start=2):
        if row_number > 5001:
            errors.append({"row": row_number, "error": "Maximum 5,000 rows per import"})
            break
        try:
            title = (row.get("Title") or "").strip()
            tx_type = (row.get("Type") or "Expense").strip().title()
            category = categories.get((row.get("Category") or "").strip().casefold())
            account = accounts.get((row.get("Account") or "").strip().casefold())
            amount = float((row.get("Amount") or "").replace(",", "").strip())
            date_value = datetime.fromisoformat((row.get("Date") or "").strip().replace("Z", ""))
            if not title or tx_type not in {"Income", "Expense"} or amount <= 0:
                raise ValueError("Title, Type, and positive Amount are required")
            if not category:
                raise ValueError(f"Category not found: {row.get('Category', '')}")
            if not account:
                raise ValueError(f"Account not found: {row.get('Account', '')}")
            if tx_type == "Expense" and amount > 20000:
                raise ValueError("INR expense amount cannot exceed Rs 20,000")

            duplicate_key = (title.casefold(), round(amount, 2), date_value.isoformat(), account.id)
            if duplicate_key in existing_keys:
                skipped += 1
                continue
            existing_keys.add(duplicate_key)
            pending.append(Transaction(
                title=title,
                amount=amount,
                original_amount=amount,
                currency="INR",
                exchange_rate=1.0,
                type=tx_type,
                category_id=category.id,
                account_id=account.id,
                date=date_value,
                payment_method=(row.get("Payment Method") or "UPI").strip(),
                status=(row.get("Status") or "Completed").strip(),
                notes=(row.get("Notes") or "").strip() or None,
            ))
            imported += 1
        except (TypeError, ValueError) as exc:
            errors.append({"row": row_number, "error": str(exc)})

    if pending:
        db.add_all(pending)
        db.commit()
        for account in accounts.values():
            sync_account_balance(db, account)

    return {"imported": imported, "skipped_duplicates": skipped, "failed": len(errors), "errors": errors[:100]}

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == tx_in.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category does not exist")

    account = db.query(Account).filter(Account.id == tx_in.account_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Account does not exist")

    tx = Transaction(
        title=tx_in.title,
        amount=tx_in.amount,
        currency=tx_in.currency or "INR",
        original_amount=tx_in.original_amount,
        exchange_rate=tx_in.exchange_rate or 1.0,
        type=tx_in.type,
        category_id=tx_in.category_id,
        account_id=tx_in.account_id,
        date=tx_in.date,
        payment_method=tx_in.payment_method,
        notes=tx_in.notes,
        is_credit_due=tx_in.is_credit_due or False,
        due_date=tx_in.due_date,
        status=tx_in.status or "Completed",
        policy_name=tx_in.policy_name,
        receipt_image_url=tx_in.receipt_image_url
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Sync account balance
    sync_account_balance(db, account)

    # Reload with relationships
    db.refresh(tx)
    return tx

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, tx_in: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    old_account = tx.account

    update_data = tx_in.dict(exclude_unset=True)
    effective_type = update_data.get("type", tx.type)
    effective_currency = update_data.get("currency", tx.currency)
    effective_amount = update_data.get("amount", tx.amount)
    effective_original_amount = update_data.get("original_amount", tx.original_amount or effective_amount)
    limit_value = effective_amount if effective_currency == "INR" else effective_original_amount
    if effective_type == "Expense" and limit_value > 20000:
        raise HTTPException(status_code=422, detail="Expense amount cannot exceed Rs 20,000")
    if "category_id" in update_data:
        cat = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Category does not exist")

    if "account_id" in update_data:
        new_account = db.query(Account).filter(Account.id == update_data["account_id"]).first()
        if not new_account:
            raise HTTPException(status_code=400, detail="Account does not exist")

    for field, val in update_data.items():
        setattr(tx, field, val)

    db.commit()
    db.refresh(tx)

    # Sync balances
    if old_account:
        sync_account_balance(db, old_account)
    if tx.account and tx.account.id != (old_account.id if old_account else None):
        sync_account_balance(db, tx.account)

    return tx

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account = tx.account
    db.delete(tx)
    db.commit()

    if account:
        sync_account_balance(db, account)

    return None
