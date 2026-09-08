from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)  # 1 - 12
    year = Column(Integer, nullable=False)   # e.g., 2026
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)  # Null indicates overall monthly budget
    amount_limit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="budgets")
