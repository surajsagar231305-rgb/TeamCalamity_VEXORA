from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class SummaryCardResponse(BaseModel):
    total_balance: float
    total_income: float
    total_expenses: float
    net_savings: float
    this_month_expenses: float
    transaction_count: int
    period_label: str

class CategoryExpenseItem(BaseModel):
    category_id: int
    category_name: str
    icon: str
    color: str
    total_amount: float
    percentage: float
    transaction_count: int

class MonthlySummaryItem(BaseModel):
    month_name: str
    year: int
    income: float
    expense: float
    savings: float

class DailyTrendItem(BaseModel):
    date: str
    amount: float
    cumulative: float

class FinancialInsightsResponse(BaseModel):
    highest_spending_category: Optional[Dict[str, Any]] = None
    lowest_spending_category: Optional[Dict[str, Any]] = None
    total_spending_this_month: float = 0.0
    average_daily_spending: float = 0.0
    largest_transaction: Optional[Dict[str, Any]] = None
    total_transactions: int = 0
    mom_spending_change_percent: Optional[float] = None
    budget_utilization_percent: Optional[float] = None
    most_frequent_payment_method: Optional[Dict[str, Any]] = None
    savings_rate_percent: float = 0.0
    smart_tip: str = ""

class CreditCardSummaryResponse(BaseModel):
    total_outstanding: float
    total_credit_limit: float
    overall_utilization_percent: float
    upcoming_dues: List[Dict[str, Any]]
    unpaid_count: int
    paid_count: int

class InsuranceMedicalSummaryResponse(BaseModel):
    total_insurance_premium: float
    total_medical_expenses: float
    total_healthcare_spend: float
    active_policies: List[Dict[str, Any]]
    recent_medical_transactions: List[Dict[str, Any]]
