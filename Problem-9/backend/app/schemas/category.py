from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(default="Expense", pattern="^(Expense|Income)$")
    icon: Optional[str] = Field(default="tag", max_length=50)
    color: Optional[str] = Field(default="#6366F1", max_length=20)
    description: Optional[str] = None
    is_system: Optional[bool] = False

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = Field(default=None, pattern="^(Expense|Income)$")
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    transaction_count: Optional[int] = 0
    total_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True
