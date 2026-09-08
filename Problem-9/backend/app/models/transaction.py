from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # Income, Expense
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    payment_method = Column(String(50), nullable=False, default="UPI")  # Cash, UPI, Credit Card, Debit Card, Bank Transfer, Net Banking, Other
    notes = Column(Text, nullable=True)
    
    # Specialized tracking for Credit Cards and Insurance/Medical
    is_credit_due = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(30), default="Completed")  # Completed, Pending, Paid, Unpaid
    policy_name = Column(String(150), nullable=True)  # Health/Life insurance policy or medical tracking
    receipt_image_url = Column(Text, nullable=True)  # File URL or base64 image data of receipt

    # Multi-currency support
    currency = Column(String(10), default="INR")  # INR, USD, EUR, GBP, AED, CAD, AUD, JPY, SGD
    original_amount = Column(Float, nullable=True)  # Amount in receipt's original currency
    exchange_rate = Column(Float, default=1.0)  # Exchange rate to INR at time of transaction

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
