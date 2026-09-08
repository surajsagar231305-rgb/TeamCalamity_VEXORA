from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List
from calendar import monthrange
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.models.budget import Budget

def get_period_date_range(period: str):
    now = datetime.utcnow()
    today = now.date()

    if period == "this_week":
        start_date = today - timedelta(days=today.weekday())  # Monday
        end_date = today + timedelta(days=(6 - today.weekday()))
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())
        label = "This Week"
    elif period == "this_month":
        start_dt = datetime(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
        label = "This Month"
    elif period == "last_month":
        first_of_this_month = datetime(today.year, today.month, 1)
        last_month_end = first_of_this_month - timedelta(seconds=1)
        start_dt = datetime(last_month_end.year, last_month_end.month, 1)
        end_dt = last_month_end
        label = "Last Month"
    elif period == "last_3_months":
        start_dt = now - timedelta(days=90)
        end_dt = now
        label = "Last 3 Months"
    elif period == "this_year":
        start_dt = datetime(today.year, 1, 1)
        end_dt = datetime(today.year, 12, 31, 23, 59, 59)
        label = "This Year"
    else:  # all_time or default
        start_dt = None
        end_dt = None
        label = "All Time"

    return start_dt, end_dt, label

def get_summary_cards(db: Session, period: str = "this_month") -> Dict[str, Any]:
    start_dt, end_dt, label = get_period_date_range(period)
    
    # Calculate account balances
    accounts = db.query(Account).all()
    # Positive balance for bank/cash/demat, subtract credit card outstanding
    total_balance = 0.0
    for acc in accounts:
        if acc.type == "Credit Card":
            total_balance -= acc.current_balance
        else:
            total_balance += acc.current_balance

    # Query transactions in period
    query = db.query(Transaction)
    if start_dt and end_dt:
        query = query.filter(Transaction.date >= start_dt, Transaction.date <= end_dt)

    transactions = query.all()
    total_income = sum(t.amount for t in transactions if t.type == "Income")
    total_expenses = sum(t.amount for t in transactions if t.type == "Expense")
    net_savings = total_income - total_expenses
    transaction_count = len(transactions)

    # Current calendar month expenses
    now = datetime.utcnow()
    cur_month_start = datetime(now.year, now.month, 1)
    cur_month_expenses = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.type == "Expense", Transaction.date >= cur_month_start)\
        .scalar() or 0.0

    return {
        "total_balance": round(total_balance, 2),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),
        "this_month_expenses": round(cur_month_expenses, 2),
        "transaction_count": transaction_count,
        "period_label": label
    }

def get_category_expenses(db: Session, period: str = "this_month") -> List[Dict[str, Any]]:
    start_dt, end_dt, _ = get_period_date_range(period)
    
    query = db.query(
        Category.id.label("category_id"),
        Category.name.label("category_name"),
        Category.icon.label("icon"),
        Category.color.label("color"),
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("transaction_count")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.type == "Expense")

    if start_dt and end_dt:
        query = query.filter(Transaction.date >= start_dt, Transaction.date <= end_dt)

    results = query.group_by(Category.id).order_by(desc("total_amount")).all()
    grand_total = sum(r.total_amount for r in results) or 1.0

    output = []
    for r in results:
        pct = round((r.total_amount / grand_total) * 100, 1)
        output.append({
            "category_id": r.category_id,
            "category_name": r.category_name,
            "icon": r.icon or "tag",
            "color": r.color or "#6366F1",
            "total_amount": round(r.total_amount, 2),
            "percentage": pct,
            "transaction_count": r.transaction_count
        })
    return output

def get_monthly_summary(db: Session, months_count: int = 6) -> List[Dict[str, Any]]:
    now = datetime.utcnow()
    output = []

    for i in range(months_count - 1, -1, -1):
        target_date = now - timedelta(days=i * 30)
        y, m = target_date.year, target_date.month
        start_dt = datetime(y, m, 1)
        _, last_day = monthrange(y, m)
        end_dt = datetime(y, m, last_day, 23, 59, 59)
        m_name = start_dt.strftime("%b %Y")

        inc = db.query(func.sum(Transaction.amount))\
            .filter(Transaction.type == "Income", Transaction.date >= start_dt, Transaction.date <= end_dt)\
            .scalar() or 0.0
        exp = db.query(func.sum(Transaction.amount))\
            .filter(Transaction.type == "Expense", Transaction.date >= start_dt, Transaction.date <= end_dt)\
            .scalar() or 0.0

        output.append({
            "month_name": m_name,
            "year": y,
            "income": round(inc, 2),
            "expense": round(exp, 2),
            "savings": round(inc - exp, 2)
        })
    return output

def get_daily_spending_trend(db: Session, period: str = "this_month") -> List[Dict[str, Any]]:
    start_dt, end_dt, _ = get_period_date_range(period)
    if not start_dt:
        start_dt = datetime.utcnow() - timedelta(days=30)
    if not end_dt:
        end_dt = datetime.utcnow()

    txs = db.query(Transaction)\
        .filter(Transaction.type == "Expense", Transaction.date >= start_dt, Transaction.date <= end_dt)\
        .order_by(Transaction.date.asc())\
        .all()

    daily_map = {}
    curr = start_dt.date()
    end_date = end_dt.date()
    while curr <= end_date:
        daily_map[curr.strftime("%Y-%m-%d")] = 0.0
        curr += timedelta(days=1)

    for t in txs:
        d_str = t.date.strftime("%Y-%m-%d")
        if d_str in daily_map:
            daily_map[d_str] += t.amount

    running_sum = 0.0
    trend = []
    for d_str in sorted(daily_map.keys()):
        amt = daily_map[d_str]
        running_sum += amt
        trend.append({
            "date": d_str,
            "amount": round(amt, 2),
            "cumulative": round(running_sum, 2)
        })
    return trend

def get_financial_insights(db: Session) -> Dict[str, Any]:
    now = datetime.utcnow()
    cur_month_start = datetime(now.year, now.month, 1)
    
    # Previous month range
    prev_month_end = cur_month_start - timedelta(seconds=1)
    prev_month_start = datetime(prev_month_end.year, prev_month_end.month, 1)

    # 1. Highest & lowest spending category this month
    cat_expenses = db.query(
        Category.name,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(Transaction.type == "Expense", Transaction.date >= cur_month_start)\
     .group_by(Category.id)\
     .order_by(desc("total")).all()

    highest_cat = {"name": cat_expenses[0][0], "amount": round(cat_expenses[0][1], 2)} if cat_expenses else None
    lowest_cat = {"name": cat_expenses[-1][0], "amount": round(cat_expenses[-1][1], 2)} if cat_expenses else None

    # 2. Total spending this month
    total_spending_this_month = sum(c[1] for c in cat_expenses) if cat_expenses else 0.0

    # 3. Average daily spending
    days_elapsed = max(1, now.day)
    avg_daily_spending = round(total_spending_this_month / days_elapsed, 2)

    # 4. Largest transaction
    largest_tx = db.query(Transaction)\
        .filter(Transaction.type == "Expense")\
        .order_by(desc(Transaction.amount)).first()
    largest_info = None
    if largest_tx:
        largest_info = {
            "title": largest_tx.title,
            "amount": round(largest_tx.amount, 2),
            "date": largest_tx.date.strftime("%Y-%m-%d"),
            "category": largest_tx.category.name if largest_tx.category else "Uncategorized"
        }

    # 5. Month-over-Month change
    prev_spending = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.type == "Expense", Transaction.date >= prev_month_start, Transaction.date <= prev_month_end)\
        .scalar() or 0.0

    mom_change = None
    if prev_spending > 0:
        mom_change = round(((total_spending_this_month - prev_spending) / prev_spending) * 100, 1)

    # 6. Budget utilization
    total_budget = db.query(func.sum(Budget.amount_limit))\
        .filter(Budget.month == now.month, Budget.year == now.year)\
        .scalar() or 0.0

    budget_utilization = None
    if total_budget > 0:
        budget_utilization = round((total_spending_this_month / total_budget) * 100, 1)

    # 7. Most frequent payment method
    pm_stats = db.query(
        Transaction.payment_method,
        func.count(Transaction.id).label("cnt")
    ).group_by(Transaction.payment_method)\
     .order_by(desc("cnt")).first()

    most_frequent_pm = {"method": pm_stats[0], "count": pm_stats[1]} if pm_stats else None

    # 8. Income & Savings Rate
    inc_this_month = db.query(func.sum(Transaction.amount))\
        .filter(Transaction.type == "Income", Transaction.date >= cur_month_start)\
        .scalar() or 0.0

    savings_rate = 0.0
    if inc_this_month > 0:
        savings_rate = round(max(0.0, ((inc_this_month - total_spending_this_month) / inc_this_month) * 100), 1)

    # Smart algorithmic tips
    tips = []
    if budget_utilization and budget_utilization > 85:
        tips.append(f"Caution: You have utilized {budget_utilization}% of this month's budget with {monthrange(now.year, now.month)[1] - now.day} days remaining.")
    elif savings_rate >= 30:
        tips.append(f"Excellent financial discipline! Your savings rate is {savings_rate}% this month. Consider investing surplus into your Demat account.")
    elif highest_cat:
        tips.append(f"Spending in '{highest_cat['name']}' represents your largest expense outflow this month (₹{highest_cat['amount']:,.2f}).")
    else:
        tips.append("Maintain steady tracking by recording transactions daily to get deeper insights.")

    total_tx_count = db.query(func.count(Transaction.id)).scalar() or 0

    return {
        "highest_spending_category": highest_cat,
        "lowest_spending_category": lowest_cat,
        "total_spending_this_month": round(total_spending_this_month, 2),
        "average_daily_spending": avg_daily_spending,
        "largest_transaction": largest_info,
        "total_transactions": total_tx_count,
        "mom_spending_change_percent": mom_change,
        "budget_utilization_percent": budget_utilization,
        "most_frequent_payment_method": most_frequent_pm,
        "savings_rate_percent": savings_rate,
        "smart_tip": tips[0] if tips else "Track expenses regularly to optimize your savings."
    }
