from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.transaction import CategoryBrief

class BudgetBase(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)
    category_id: Optional[int] = None
    amount_limit: float = Field(..., gt=0)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount_limit: Optional[float] = Field(default=None, gt=0)

class BudgetResponse(BudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryBrief] = None

    class Config:
        from_attributes = True

class BudgetStatusResponse(BaseModel):
    id: int
    month: int
    year: int
    category_id: Optional[int] = None
    category_name: str
    category_icon: Optional[str] = "tag"
    category_color: Optional[str] = "#6366F1"
    amount_limit: float
    spent: float
    remaining: float
    percentage_used: float
    is_over_budget: bool
    warning_level: str  # "normal", "warning" (>80%), "danger" (>100%)
