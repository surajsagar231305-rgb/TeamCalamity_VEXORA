from typing import List, Optional
from datetime import datetime
from calendar import monthrange
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetStatusResponse
)

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetStatusResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    start_dt = datetime(y, m, 1)
    _, last_day = monthrange(y, m)
    end_dt = datetime(y, m, last_day, 23, 59, 59)

    budgets = db.query(Budget).filter(Budget.month == m, Budget.year == y).all()
    results = []

    for b in budgets:
        if b.category_id:
            cat = b.category
            cat_name = cat.name if cat else "Uncategorized"
            cat_icon = cat.icon if cat else "tag"
            cat_color = cat.color if cat else "#6366F1"

            spent = db.query(func.sum(Transaction.amount))\
                .filter(
                    Transaction.type == "Expense",
                    Transaction.category_id == b.category_id,
                    Transaction.date >= start_dt,
                    Transaction.date <= end_dt
                ).scalar() or 0.0
        else:
            cat_name = "Overall Monthly Budget"
            cat_icon = "wallet"
            cat_color = "#3B82F6"

            spent = db.query(func.sum(Transaction.amount))\
                .filter(
                    Transaction.type == "Expense",
                    Transaction.date >= start_dt,
                    Transaction.date <= end_dt
                ).scalar() or 0.0

        limit = b.amount_limit
        rem = max(0.0, limit - spent)
        pct = round((spent / limit) * 100, 1) if limit > 0 else 0.0
        is_over = spent > limit

        if pct > 100:
            warning_level = "danger"
        elif pct >= 80:
            warning_level = "warning"
        else:
            warning_level = "normal"

        results.append(BudgetStatusResponse(
            id=b.id,
            month=b.month,
            year=b.year,
            category_id=b.category_id,
            category_name=cat_name,
            category_icon=cat_icon,
            category_color=cat_color,
            amount_limit=round(limit, 2),
            spent=round(spent, 2),
            remaining=round(rem, 2),
            percentage_used=pct,
            is_over_budget=is_over,
            warning_level=warning_level
        ))

    return results

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(budget_in: BudgetCreate, db: Session = Depends(get_db)):
    # Check if duplicate exists for same category and month/year
    existing = db.query(Budget).filter(
        Budget.month == budget_in.month,
        Budget.year == budget_in.year,
        Budget.category_id == budget_in.category_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A budget for this category and month/year already exists. Please update the existing budget instead."
        )

    if budget_in.category_id:
        cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Category does not exist")

    budget = Budget(
        month=budget_in.month,
        year=budget_in.year,
        category_id=budget_in.category_id,
        amount_limit=budget_in.amount_limit
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, budget_in: BudgetUpdate, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")

    if budget_in.amount_limit is not None:
        b.amount_limit = budget_in.amount_limit

    db.commit()
    db.refresh(b)
    return b

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return None
