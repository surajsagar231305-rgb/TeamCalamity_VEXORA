from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.dashboard import CreditCardSummaryResponse
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/api/credit-cards", tags=["Credit Cards"])

@router.get("/summary", response_model=CreditCardSummaryResponse)
def credit_card_summary(db: Session = Depends(get_db)):
    card_accounts = db.query(Account).filter(Account.type == "Credit Card").all()
    
    total_limit = sum(c.credit_limit or 0.0 for c in card_accounts)
    total_outstanding = sum(c.current_balance for c in card_accounts)

    utilization = round((total_outstanding / total_limit) * 100, 1) if total_limit > 0 else 0.0

    # Get credit card transactions or transactions with is_credit_due = True
    card_account_ids = [c.id for c in card_accounts]
    
    dues_query = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).filter(
        (Transaction.account_id.in_(card_account_ids)) | (Transaction.is_credit_due == True)
    )

    all_card_txs = dues_query.order_by(desc(Transaction.date)).all()

    upcoming_dues = []
    unpaid_count = 0
    paid_count = 0

    for t in all_card_txs:
        is_paid = (t.status == "Paid")
        if is_paid:
            paid_count += 1
        else:
            unpaid_count += 1

        if t.status in ["Unpaid", "Pending"] or (t.due_date and t.due_date >= datetime.utcnow()):
            upcoming_dues.append({
                "transaction_id": t.id,
                "title": t.title,
                "amount": t.amount,
                "card_name": t.account.name if t.account else "Card",
                "category": t.category.name if t.category else "Other",
                "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
                "status": t.status or "Unpaid"
            })

    return CreditCardSummaryResponse(
        total_outstanding=round(total_outstanding, 2),
        total_credit_limit=round(total_limit, 2),
        overall_utilization_percent=utilization,
        upcoming_dues=upcoming_dues[:15],
        unpaid_count=unpaid_count,
        paid_count=paid_count
    )

@router.get("/transactions", response_model=List[TransactionResponse])
def get_credit_card_transactions(db: Session = Depends(get_db)):
    card_accounts = db.query(Account).filter(Account.type == "Credit Card").all()
    card_ids = [c.id for c in card_accounts]

    txs = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).filter(
        (Transaction.account_id.in_(card_ids)) | (Transaction.is_credit_due == True)
    ).order_by(desc(Transaction.date)).all()

    return [TransactionResponse.from_orm(t) for t in txs]

@router.patch("/{transaction_id}/toggle-status")
def toggle_credit_card_status(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    new_status = "Paid" if tx.status != "Paid" else "Unpaid"
    tx.status = new_status
    db.commit()
    db.refresh(tx)
    return {"id": tx.id, "status": tx.status, "message": f"Status updated to {new_status}"}
