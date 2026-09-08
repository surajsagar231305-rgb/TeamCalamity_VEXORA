from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])

def sync_account_balance(db: Session, account: Account):
    inc = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.account_id == account.id, Transaction.type == "Income")\
        .scalar() or 0.0
    exp = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.account_id == account.id, Transaction.type == "Expense")\
        .scalar() or 0.0
    
    if account.type == "Credit Card":
        # For credit cards, current_balance represents outstanding spent amount
        account.current_balance = round(exp - inc, 2)
    else:
        account.current_balance = round(account.opening_balance + inc - exp, 2)
    
    db.commit()
    db.refresh(account)
    return account

@router.get("", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).all()
    results = []
    for acc in accounts:
        sync_account_balance(db, acc)
        tx_count = db.query(func.count(Transaction.id))\
            .filter(Transaction.account_id == acc.id)\
            .scalar() or 0
        acc_dict = AccountResponse.from_orm(acc).dict()
        acc_dict["transaction_count"] = tx_count
        results.append(acc_dict)
    return results

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(account_in: AccountCreate, db: Session = Depends(get_db)):
    account = Account(
        name=account_in.name,
        type=account_in.type,
        opening_balance=account_in.opening_balance,
        current_balance=account_in.opening_balance,
        account_number_last4=account_in.account_number_last4,
        credit_limit=account_in.credit_limit or 0.0,
        due_date_day=account_in.due_date_day,
        notes=account_in.notes
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    sync_account_balance(db, account)
    tx_count = db.query(func.count(Transaction.id))\
        .filter(Transaction.account_id == account.id)\
        .scalar() or 0
    res = AccountResponse.from_orm(account).dict()
    res["transaction_count"] = tx_count
    return res

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account_in: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = account_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(account, field, val)
    
    db.commit()
    sync_account_balance(db, account)
    return account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return None
