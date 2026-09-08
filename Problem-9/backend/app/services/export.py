import csv
import io
from typing import List
from app.models.transaction import Transaction

def generate_transactions_csv(transactions: List[Transaction]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    # Header required by problem specification:
    # Date, Title, Amount, Type, Category, Payment Method, Account, Notes
    writer.writerow([
        "Transaction ID",
        "Date",
        "Title",
        "Amount",
        "Type",
        "Category",
        "Payment Method",
        "Account",
        "Status",
        "Notes",
        "Policy / Card Details"
    ])

    for t in transactions:
        cat_name = t.category.name if t.category else "Uncategorized"
        acc_name = t.account.name if t.account else "Unknown"
        date_str = t.date.strftime("%Y-%m-%d %H:%M")
        details = t.policy_name if t.policy_name else ("Due Date: " + t.due_date.strftime("%Y-%m-%d") if t.due_date else "")

        writer.writerow([
            t.id,
            date_str,
            t.title,
            f"{t.amount:.2f}",
            t.type,
            cat_name,
            t.payment_method,
            acc_name,
            t.status or "Completed",
            t.notes or "",
            details
        ])

    return output.getvalue()
