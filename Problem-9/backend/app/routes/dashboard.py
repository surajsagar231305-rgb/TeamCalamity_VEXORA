from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dashboard import (
    SummaryCardResponse,
    CategoryExpenseItem,
    MonthlySummaryItem,
    DailyTrendItem,
    FinancialInsightsResponse
)
from app.services.analytics import (
    get_summary_cards,
    get_category_expenses,
    get_monthly_summary,
    get_daily_spending_trend,
    get_financial_insights
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=SummaryCardResponse)
def dashboard_summary(
    period: str = Query("this_month", pattern="^(this_week|this_month|last_month|last_3_months|this_year|all_time)$"),
    db: Session = Depends(get_db)
):
    return get_summary_cards(db, period)

@router.get("/category-expenses", response_model=List[CategoryExpenseItem])
def dashboard_category_expenses(
    period: str = Query("this_month", pattern="^(this_week|this_month|last_month|last_3_months|this_year|all_time)$"),
    db: Session = Depends(get_db)
):
    return get_category_expenses(db, period)

@router.get("/monthly-summary", response_model=List[MonthlySummaryItem])
def dashboard_monthly_summary(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    return get_monthly_summary(db, months)

@router.get("/trend", response_model=List[DailyTrendItem])
def dashboard_trend(
    period: str = Query("this_month", pattern="^(this_week|this_month|last_month|last_3_months|this_year|all_time)$"),
    db: Session = Depends(get_db)
):
    return get_daily_spending_trend(db, period)

@router.get("/insights", response_model=FinancialInsightsResponse)
def dashboard_insights(db: Session = Depends(get_db)):
    return get_financial_insights(db)
