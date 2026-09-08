import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path so app imports work cleanly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.routes.accounts import sync_account_balance

def seed():
    print("Resetting and creating fresh database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding Accounts...")
        accounts_data = [
            Account(name="HDFC Salary Account", type="Savings", opening_balance=75000.0, current_balance=75000.0, account_number_last4="4892", notes="Primary salaried bank account"),
            Account(name="ICICI Emergency Fund", type="Savings", opening_balance=50000.0, current_balance=50000.0, account_number_last4="1029", notes="High-yield savings for emergencies"),
            Account(name="Zerodha Demat Account", type="Demat Account", opening_balance=180000.0, current_balance=180000.0, account_number_last4="8821", notes="Equity holdings and active trades"),
            Account(name="Groww Mutual Funds", type="Investment Account", opening_balance=95000.0, current_balance=95000.0, account_number_last4="5531", notes="Long-term index and ELSS funds"),
            Account(name="HDFC Regalia Gold", type="Credit Card", opening_balance=0.0, current_balance=0.0, account_number_last4="9012", credit_limit=250000.0, due_date_day=18, notes="Travel and dining privileges"),
            Account(name="SBI SimplyClick Card", type="Credit Card", opening_balance=0.0, current_balance=0.0, account_number_last4="3341", credit_limit=100000.0, due_date_day=26, notes="Online shopping cashback card"),
            Account(name="Physical Cash Wallet", type="Cash Wallet", opening_balance=6500.0, current_balance=6500.0, notes="Cash on hand for small vendors")
        ]
        db.add_all(accounts_data)
        db.commit()

        # Map accounts by name
        acc_map = {acc.name: acc for acc in db.query(Account).all()}

        print("Seeding Categories...")
        categories_data = [
            # Expense Categories
            Category(name="Food & Dining", type="Expense", icon="utensils", color="#F59E0B", description="Groceries, dining out, and food delivery", is_system=True),
            Category(name="Transportation", type="Expense", icon="car", color="#3B82F6", description="Fuel, public transit, cabs, vehicle maintenance", is_system=True),
            Category(name="Shopping", type="Expense", icon="shopping-bag", color="#EC4899", description="Clothing, electronics, home items", is_system=True),
            Category(name="Education", type="Expense", icon="graduation-cap", color="#8B5CF6", description="Courses, books, tuition, certifications", is_system=True),
            Category(name="Medical & Health", type="Expense", icon="activity", color="#EF4444", description="Doctor visits, consultations, medicines, tests", is_system=True),
            Category(name="Health Insurance", type="Expense", icon="shield-check", color="#10B981", description="Mediclaim and health policy premiums", is_system=True),
            Category(name="Life Insurance", type="Expense", icon="shield", color="#059669", description="Term life and endowment policy premiums", is_system=True),
            Category(name="Credit Card Payments", type="Expense", icon="credit-card", color="#F97316", description="Monthly bill settlement for credit cards", is_system=True),
            Category(name="Demat & Equity", type="Expense", icon="trending-up", color="#6366F1", description="Stock purchases, Demat AMC, brokerage", is_system=True),
            Category(name="Mutual Funds & SIP", type="Expense", icon="pie-chart", color="#4F46E5", description="Monthly systematic investment plans", is_system=True),
            Category(name="Utilities & Bills", type="Expense", icon="zap", color="#EAB308", description="Electricity, water, Wi-Fi broadband, mobile recharge", is_system=True),
            Category(name="Entertainment", type="Expense", icon="film", color="#A855F7", description="Movies, OTT subscriptions, concerts, games", is_system=True),
            Category(name="House Rent", type="Expense", icon="home", color="#14B8A6", description="Monthly flat/apartment rental", is_system=True),
            Category(name="Other Expenses", type="Expense", icon="more-horizontal", color="#64748B", description="Miscellaneous one-off purchases", is_system=True),

            # Income Categories
            Category(name="Salary", type="Income", icon="dollar-sign", color="#22C55E", description="Monthly corporate payroll credit", is_system=True),
            Category(name="Freelance & Consulting", type="Income", icon="briefcase", color="#06B6D4", description="Independent client projects", is_system=True),
            Category(name="Dividends & Stock Returns", type="Income", icon="percent", color="#84CC16", description="Company dividend payouts and booked profits", is_system=True),
            Category(name="Other Income", type="Income", icon="plus-circle", color="#10B981", description="Cashbacks, refunds, gifts", is_system=True)
        ]
        db.add_all(categories_data)
        db.commit()

        cat_map = {c.name: c for c in db.query(Category).all()}

        print("Seeding Realistic Multi-Month Transactions...")
        now = datetime.utcnow()
        tx_list = []

        # Helper to generate dates relative to today
        def d(days_ago, hour=14, minute=30):
            dt = now - timedelta(days=days_ago)
            return datetime(dt.year, dt.month, dt.day, hour, minute)

        # ----------------- INCOME TRANSACTIONS -----------------
        tx_list.extend([
            Transaction(title="Monthly Salary - Current Month", amount=92000.0, type="Income", category_id=cat_map["Salary"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(7, 10, 0), payment_method="Bank Transfer", notes="Direct salary credit for corporate role"),
            Transaction(title="UI/UX Consulting Project", amount=28500.0, type="Income", category_id=cat_map["Freelance & Consulting"].id, account_id=acc_map["ICICI Emergency Fund"].id, date=d(14, 16, 0), payment_method="UPI", notes="Frontend dashboard contract delivery"),
            Transaction(title="TCS Quarterly Dividend", amount=3450.0, type="Income", category_id=cat_map["Dividends & Stock Returns"].id, account_id=acc_map["Zerodha Demat Account"].id, date=d(18, 11, 0), payment_method="Net Banking", notes="75 shares dividend payout"),
            Transaction(title="Monthly Salary - Last Month", amount=92000.0, type="Income", category_id=cat_map["Salary"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(37, 10, 0), payment_method="Bank Transfer", notes="Monthly payroll"),
            Transaction(title="Freelance API Integration", amount=21000.0, type="Income", category_id=cat_map["Freelance & Consulting"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(45, 15, 30), payment_method="UPI", notes="FastAPI integration backend milestone"),
            Transaction(title="Monthly Salary - 2 Months Ago", amount=90000.0, type="Income", category_id=cat_map["Salary"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(68, 10, 0), payment_method="Bank Transfer", notes="Monthly payroll"),
            Transaction(title="Infosys Dividend", amount=2800.0, type="Income", category_id=cat_map["Dividends & Stock Returns"].id, account_id=acc_map["Zerodha Demat Account"].id, date=d(75, 11, 0), payment_method="Net Banking", notes="Equity dividend credit")
        ])

        # ----------------- INSURANCE & MEDICAL -----------------
        tx_list.extend([
            Transaction(title="Star Health Comprehensive Policy Renewal", amount=16500.0, type="Expense", category_id=cat_map["Health Insurance"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(20), payment_method="Net Banking", policy_name="Star Health Family Optima #SH-88219", due_date=d(-345), status="Completed", receipt_image_url="/uploads/sample_star_health_receipt.png", notes="Annual premium paid with ₹10 Lakh sum insured"),
            Transaction(title="HDFC Life Click 2 Protect 3D", amount=19800.0, type="Expense", category_id=cat_map["Life Insurance"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(52), payment_method="Net Banking", policy_name="HDFC Life Term Policy #HL-99201", due_date=d(-313), status="Completed", notes="Term insurance coverage up to age 65"),
            Transaction(title="Max Healthcare Diagnostic Tests", amount=3600.0, type="Expense", category_id=cat_map["Medical & Health"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(5), payment_method="Credit Card", notes="Annual blood checkup and vitamin profiles"),
            Transaction(title="Apollo Pharmacy Medicines", amount=1420.0, type="Expense", category_id=cat_map["Medical & Health"].id, account_id=acc_map["Physical Cash Wallet"].id, date=d(11), payment_method="Cash", notes="Prescription antibiotics and supplements"),
            Transaction(title="Dental Cleaning & Fluoride Treatment", amount=2200.0, type="Expense", category_id=cat_map["Medical & Health"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(42), payment_method="Credit Card", notes="Routine oral hygiene checkup")
        ])

        # ----------------- DEMAT & INVESTMENTS -----------------
        tx_list.extend([
            Transaction(title="NIFTY 50 Index Fund SIP", amount=15000.0, type="Expense", category_id=cat_map["Mutual Funds & SIP"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(6), payment_method="Net Banking", notes="Automated monthly mutual fund investment"),
            Transaction(title="Parag Parikh Flexi Cap SIP", amount=10000.0, type="Expense", category_id=cat_map["Mutual Funds & SIP"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(6), payment_method="Net Banking", notes="Equity diversification SIP"),
            Transaction(title="Purchased 15 Shares of HDFC Bank", amount=19800.0, type="Expense", category_id=cat_map["Demat & Equity"].id, account_id=acc_map["Zerodha Demat Account"].id, date=d(12), payment_method="Net Banking", notes="Demat equity accumulation at ₹1,320/share"),
            Transaction(title="NIFTY 50 Index Fund SIP - Last Month", amount=15000.0, type="Expense", category_id=cat_map["Mutual Funds & SIP"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(36), payment_method="Net Banking", notes="Monthly SIP instalment"),
            Transaction(title="Purchased 20 Shares of Tata Motors", amount=18600.0, type="Expense", category_id=cat_map["Demat & Equity"].id, account_id=acc_map["Zerodha Demat Account"].id, date=d(48), payment_method="Net Banking", notes="Long term equity accumulation")
        ])

        # ----------------- CREDIT CARD TRANSACTIONS & DUES -----------------
        tx_list.extend([
            Transaction(title="Apple Store - AirPods Pro USB-C", amount=19900.0, type="Expense", category_id=cat_map["Shopping"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(3), payment_method="Credit Card", is_credit_due=True, due_date=d(-15), status="Unpaid", receipt_image_url="/uploads/sample_apple_receipt.png", notes="Upcoming credit card statement due"),
            Transaction(title="Croma Electronics - 4K Monitor", amount=16499.0, type="Expense", category_id=cat_map["Shopping"].id, account_id=acc_map["SBI SimplyClick Card"].id, date=d(8), payment_method="Credit Card", is_credit_due=True, due_date=d(-18), status="Unpaid", notes="Work from home monitor setup"),
            Transaction(title="Fine Dining at Smoke House Deli", amount=3850.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(4), payment_method="Credit Card", is_credit_due=True, due_date=d(-15), status="Unpaid", notes="Weekend team dinner"),
            Transaction(title="Flight Tickets to Bengaluru - Indigo", amount=8940.0, type="Expense", category_id=cat_map["Transportation"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(19), payment_method="Credit Card", is_credit_due=False, status="Paid", notes="Conference travel booked on card"),
            Transaction(title="HDFC Credit Card Bill Settlement", amount=18500.0, type="Expense", category_id=cat_map["Credit Card Payments"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(25), payment_method="Net Banking", status="Completed", notes="Settled previous cycle statement in full")
        ])

        # ----------------- DAILY, FOOD, UTILITIES, HOUSING -----------------
        tx_list.extend([
            Transaction(title="Monthly Apartment Rent", amount=20000.0, type="Expense", category_id=cat_map["House Rent"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(6), payment_method="Bank Transfer", notes="2BHK apartment rent to landlord"),
            Transaction(title="Nature's Basket Organic Groceries", amount=3420.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(2), payment_method="UPI", notes="Weekly fruits, veggies, and pantry items"),
            Transaction(title="Blinkit Quick Delivery", amount=740.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(1), payment_method="UPI", notes="Milk, bread, and breakfast items"),
            Transaction(title="Swiggy Gourmet Dinner", amount=1280.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(3), payment_method="UPI", notes="Italian pasta and artisan sourdough"),
            Transaction(title="Blue Tokai Coffee Roast & Pouches", amount=960.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["Physical Cash Wallet"].id, date=d(7), payment_method="Cash", notes="Ground coffee beans for espresso"),
            Transaction(title="Shell Petrol Station Fuel", amount=2800.0, type="Expense", category_id=cat_map["Transportation"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(5), payment_method="Debit Card", notes="Full tank fuel refill"),
            Transaction(title="Uber Rides - Commute to Tech Park", amount=620.0, type="Expense", category_id=cat_map["Transportation"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(2), payment_method="UPI", notes="Airport and client meeting cabs"),
            Transaction(title="Tata Power Electricity Bill", amount=2640.0, type="Expense", category_id=cat_map["Utilities & Bills"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(8), payment_method="UPI", notes="Monthly home electricity consumption"),
            Transaction(title="Airtel Xstream Fiber Broadband", amount=1179.0, type="Expense", category_id=cat_map["Utilities & Bills"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(9), payment_method="UPI", notes="300 Mbps unlimited home fiber"),
            Transaction(title="Netflix Premium & Spotify Family", amount=898.0, type="Expense", category_id=cat_map["Entertainment"].id, account_id=acc_map["SBI SimplyClick Card"].id, date=d(10), payment_method="Credit Card", notes="Monthly media subscriptions"),
            Transaction(title="PVR IMAX Movie & Popcorn", amount=1450.0, type="Expense", category_id=cat_map["Entertainment"].id, account_id=acc_map["Physical Cash Wallet"].id, date=d(13), payment_method="Cash", notes="Weekend movie outing with friends"),
            Transaction(title="Coursera Full Stack Specialization", amount=3999.0, type="Expense", category_id=cat_map["Education"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(15), payment_method="Debit Card", notes="Cloud architecture certification course"),

            # Last month expenses for comparison
            Transaction(title="Apartment Rent - Last Month", amount=20000.0, type="Expense", category_id=cat_map["House Rent"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(36), payment_method="Bank Transfer", notes="Rent payment"),
            Transaction(title="Supermarket Pantry Bulk Stock", amount=6850.0, type="Expense", category_id=cat_map["Food & Dining"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(38), payment_method="Debit Card", notes="Monthly grocery haul"),
            Transaction(title="Fuel & Metro Card Recharge", amount=3200.0, type="Expense", category_id=cat_map["Transportation"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(40), payment_method="UPI", notes="Travel expenses"),
            Transaction(title="Tata Power Electricity - Last Month", amount=3120.0, type="Expense", category_id=cat_map["Utilities & Bills"].id, account_id=acc_map["HDFC Salary Account"].id, date=d(41), payment_method="UPI", notes="Summer AC electricity bill"),
            Transaction(title="Zara Clothing Seasonal Haul", amount=7200.0, type="Expense", category_id=cat_map["Shopping"].id, account_id=acc_map["HDFC Regalia Gold"].id, date=d(44), payment_method="Credit Card", status="Paid", notes="Casual work shirts and shoes")
        ])

        db.add_all(tx_list)
        db.commit()

        print("Synchronizing Account Balances...")
        for acc in db.query(Account).all():
            sync_account_balance(db, acc)

        print("Seeding Monthly and Category Budgets...")
        cur_m = now.month
        cur_y = now.year

        budgets_data = [
            Budget(month=cur_m, year=cur_y, category_id=None, amount_limit=75000.0),  # Overall monthly budget
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Food & Dining"].id, amount_limit=12000.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Shopping"].id, amount_limit=30000.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Transportation"].id, amount_limit=7000.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Utilities & Bills"].id, amount_limit=5500.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Medical & Health"].id, amount_limit=6000.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["Entertainment"].id, amount_limit=3500.0),
            Budget(month=cur_m, year=cur_y, category_id=cat_map["House Rent"].id, amount_limit=25000.0)
        ]
        db.add_all(budgets_data)
        db.commit()

        print("Seeding successfully completed!")
        print(f"Total Accounts: {db.query(Account).count()}")
        print(f"Total Categories: {db.query(Category).count()}")
        print(f"Total Transactions: {db.query(Transaction).count()}")
        print(f"Total Budgets: {db.query(Budget).count()}")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
