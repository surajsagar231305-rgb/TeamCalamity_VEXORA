from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from app.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.dashboard import InsuranceMedicalSummaryResponse
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/api/insurance", tags=["Insurance & Medical"])

@router.get("/summary", response_model=InsuranceMedicalSummaryResponse)
def insurance_medical_summary(db: Session = Depends(get_db)):
    # Match categories related to insurance or medical
    cat_matches = db.query(Category).filter(
        or_(
            Category.name.ilike("%Insurance%"),
            Category.name.ilike("%Medical%"),
            Category.name.ilike("%Hospital%"),
            Category.name.ilike("%Medicine%"),
            Category.name.ilike("%Health%")
        )
    ).all()
    cat_ids = [c.id for c in cat_matches]

    txs = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).filter(
        or_(
            Transaction.category_id.in_(cat_ids),
            Transaction.policy_name.isnot(None)
        )
    ).order_by(desc(Transaction.date)).all()

    total_premium = 0.0
    total_medical = 0.0
    policies_map = {}
    recent_medical = []

    for t in txs:
        cat_name = t.category.name if t.category else ""
        if "Insurance" in cat_name or "Premium" in cat_name:
            total_premium += t.amount
        else:
            total_medical += t.amount

        # If policy name is set or it's an insurance entry
        p_name = t.policy_name or ("General " + cat_name if "Insurance" in cat_name else None)
        if p_name:
            if p_name not in policies_map:
                policies_map[p_name] = {
                    "policy_name": p_name,
                    "category": cat_name,
                    "last_paid_amount": t.amount,
                    "last_payment_date": t.date.strftime("%Y-%m-%d"),
                    "next_due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None,
                    "status": t.status or "Active",
                    "total_contributed": t.amount
                }
            else:
                policies_map[p_name]["total_contributed"] += t.amount

        recent_medical.append({
            "id": t.id,
            "title": t.title,
            "category": cat_name,
            "amount": t.amount,
            "date": t.date.strftime("%Y-%m-%d"),
            "account": t.account.name if t.account else "Default",
            "policy_name": t.policy_name,
            "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None
        })

    return InsuranceMedicalSummaryResponse(
        total_insurance_premium=round(total_premium, 2),
        total_medical_expenses=round(total_medical, 2),
        total_healthcare_spend=round(total_premium + total_medical, 2),
        active_policies=list(policies_map.values()),
        recent_medical_transactions=recent_medical[:15]
    )

@router.get("/transactions", response_model=List[TransactionResponse])
def get_insurance_medical_transactions(db: Session = Depends(get_db)):
    cat_matches = db.query(Category).filter(
        or_(
            Category.name.ilike("%Insurance%"),
            Category.name.ilike("%Medical%"),
            Category.name.ilike("%Hospital%"),
            Category.name.ilike("%Medicine%"),
            Category.name.ilike("%Health%")
        )
    ).all()
    cat_ids = [c.id for c in cat_matches]

    txs = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account)
    ).filter(
        or_(
            Transaction.category_id.in_(cat_ids),
            Transaction.policy_name.isnot(None)
        )
    ).order_by(desc(Transaction.date)).all()

    return [TransactionResponse.from_orm(t) for t in txs]
