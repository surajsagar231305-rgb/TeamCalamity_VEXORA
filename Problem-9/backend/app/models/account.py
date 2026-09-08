from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Savings, Current, Cash Wallet, Credit Card, Debit Card, Demat Account, Investment Account, Other
    opening_balance = Column(Float, default=0.0, nullable=False)
    current_balance = Column(Float, default=0.0, nullable=False)
    account_number_last4 = Column(String(10), nullable=True)
    credit_limit = Column(Float, default=0.0, nullable=True)  # For credit cards
    due_date_day = Column(Integer, nullable=True)  # e.g., 15 for 15th of each month
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
