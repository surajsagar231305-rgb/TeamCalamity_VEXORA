from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    opening_balance: float = Field(default=0.0)
    current_balance: Optional[float] = None
    account_number_last4: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    due_date_day: Optional[int] = Field(default=None, ge=1, le=31)
    notes: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    opening_balance: Optional[float] = None
    current_balance: Optional[float] = None
    account_number_last4: Optional[str] = None
    credit_limit: Optional[float] = None
    due_date_day: Optional[int] = Field(default=None, ge=1, le=31)
    notes: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    current_balance: float
    created_at: datetime
    updated_at: datetime
    transaction_count: Optional[int] = 0

    class Config:
        from_attributes = True
