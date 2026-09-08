from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CategoryBrief(BaseModel):
    id: int
    name: str
    type: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366F1"

    class Config:
        from_attributes = True

class AccountBrief(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    type: str = Field(..., pattern="^(Income|Expense)$")
    category_id: int
    account_id: int
    date: datetime
    payment_method: str = Field(default="UPI")
    notes: Optional[str] = None
    is_credit_due: Optional[bool] = False
    due_date: Optional[datetime] = None
    status: Optional[str] = "Completed"
    policy_name: Optional[str] = None
    receipt_image_url: Optional[str] = None
    currency: Optional[str] = "INR"
    original_amount: Optional[float] = None
    exchange_rate: Optional[float] = 1.0

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    amount: Optional[float] = Field(default=None, gt=0)
    type: Optional[str] = Field(default=None, pattern="^(Income|Expense)$")
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_credit_due: Optional[bool] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    policy_name: Optional[str] = None
    receipt_image_url: Optional[str] = None
    currency: Optional[str] = None
    original_amount: Optional[float] = None
    exchange_rate: Optional[float] = None

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryBrief] = None
    account: Optional[AccountBrief] = None

    class Config:
        from_attributes = True
