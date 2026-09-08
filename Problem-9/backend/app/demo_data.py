from datetime import datetime, timedelta

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction


def ensure_demo_data(db):
    """Populate a fresh database so the deployed demo is usable immediately."""
    if db.query(Category).count() or db.query(Account).count():
        return

    categories = [
        Category(name="Food & Dining", type="Expense", icon="utensils", color="#F59E0B", is_system=True),
        Category(name="Shopping", type="Expense", icon="shopping-bag", color="#EC4899", is_system=True),
        Category(name="Transportation", type="Expense", icon="car", color="#3B82F6", is_system=True),
        Category(name="Medical & Health", type="Expense", icon="activity", color="#EF4444", is_system=True),
        Category(name="Utilities & Bills", type="Expense", icon="zap", color="#EAB308", is_system=True),
        Category(name="Entertainment", type="Expense", icon="film", color="#A855F7", is_system=True),
        Category(name="House Rent", type="Expense", icon="home", color="#14B8A6", is_system=True),
        Category(name="Other Expenses", type="Expense", icon="more-horizontal", color="#64748B", is_system=True),
        Category(name="Salary", type="Income", icon="dollar-sign", color="#22C55E", is_system=True),
        Category(name="Freelance & Consulting", type="Income", icon="briefcase", color="#06B6D4", is_system=True),
    ]
    db.add_all(categories)
    db.flush()

    account = Account(
        name="Demo Savings Account",
        type="Savings",
        opening_balance=50000.0,
        current_balance=50000.0,
        account_number_last4="2026",
        notes="Auto-created demo account",
    )
    db.add(account)
    db.flush()

    category_map = {category.name: category for category in categories}
    now = datetime.utcnow()
    demo_transactions = [
        ("Monthly Salary", 50000.0, "Income", "Salary", 7, "Bank Transfer"),
        ("Grocery Basket", 3420.0, "Expense", "Food & Dining", 2, "UPI"),
        ("Internet Bill", 1179.0, "Expense", "Utilities & Bills", 5, "UPI"),
        ("Metro and Cab", 980.0, "Expense", "Transportation", 8, "Debit Card"),
        ("Weekend Movie", 1450.0, "Expense", "Entertainment", 12, "UPI"),
    ]
    for title, amount, tx_type, category_name, days_ago, payment_method in demo_transactions:
        db.add(Transaction(
            title=title,
            amount=amount,
            original_amount=amount,
            currency="INR",
            exchange_rate=1.0,
            type=tx_type,
            category_id=category_map[category_name].id,
            account_id=account.id,
            date=now - timedelta(days=days_ago),
            payment_method=payment_method,
            status="Completed",
            notes="Demo data for presentation",
        ))
    db.commit()