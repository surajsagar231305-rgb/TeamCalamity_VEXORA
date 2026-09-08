# ExpenseFlow — Expense Management System

### Vexora-26 Hackathon • Problem 9

> A modern, full-stack, personal finance and expense management dashboard engineered for **Problem 9** of **Vexora-26**. Track multi-account cashflows across Demat equity portfolios, health and life insurance policies, credit card billing cycles, and daily household expenses in one unified, real-time application.

---

## 🌟 Problem Statement (Problem 9)

Individuals manage different types of financial expenses such as **Demat accounts, insurance, medical policies, credit cards, and debit transactions**, making it difficult to track their overall spending.

**ExpenseFlow** solves this problem by providing a centralized financial intelligence hub where users can:

- **Record and categorize financial transactions** with real-time balance synchronization across accounts.
- **Monitor multi-account assets and liabilities** (Savings, Current, Demat, Mutual Funds, Credit Cards, Cash Wallets).
- **Track credit card billing cycles, statement dues, and payment statuses** with 1-click settlement toggles.
- **Manage health and life insurance policies**, track premium renewal due dates, and monitor hospital/pharmacy expenses.
- **Set monthly and category-specific budget targets** with visual progress bars and overspending alerts.
- **Gain algorithmic financial insights** calculated dynamically from database data (highest/lowest spending categories, average daily velocity, month-over-month change %, savings rate %, and smart tips).
- **Interactive Digital Transaction Receipts**: Click any transaction on the Dashboard or Transactions page to inspect a formal, stylized digital payment receipt with one-click **Print / Save as PDF** and clipboard sharing.
- **Export complete transaction audits** to standard CSV format.
- **Toggle Dark / Light themes** with preferences automatically saved to `localStorage`.

---

## 🛠️ Technology Stack

| Layer              | Technology              | Rationale                                                  |
| ------------------ | ----------------------- | ---------------------------------------------------------- |
| **Frontend**       | React 18 + Vite         | Lightning-fast HMR and reactive UI                         |
| **Styling**        | Tailwind CSS            | Modern responsive SaaS aesthetic with Dark/Light mode      |
| **Visualizations** | Recharts                | Interactive Donut, Dual-Bar, and Curved Trend charts       |
| **Icons**          | Lucide React            | Clean, modern iconography                                  |
| **Routing**        | React Router v6         | Client-side SPA navigation with active tab indicators      |
| **Backend**        | Python 3 + FastAPI      | High-performance async REST API with auto OpenAPI docs     |
| **Database**       | SQLite + SQLAlchemy ORM | Zero-configuration local database with foreign key support |
| **Validation**     | Pydantic v2             | Strict schema validation for requests and responses        |
| **Data Export**    | Python CSV Engine       | Direct filtered transaction export                         |

> **100% Free & Local**: No external paid services or third-party API keys are required for core functionality.

---

## 📁 Project Structure

```
Problem-9/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, routes & SPA static mount
│   │   ├── database.py          # SQLAlchemy engine, session maker & SQLite FKs
│   │   ├── models/              # SQLAlchemy ORM database models
│   │   │   ├── account.py       # Account model (Savings, Demat, Card, Cash)
│   │   │   ├── category.py      # Category model (Expense/Income, icons, colors)
│   │   │   ├── transaction.py   # Transaction model with credit & policy fields
│   │   │   └── budget.py        # Budget model (monthly & category limits)
│   │   ├── schemas/             # Pydantic validation schemas
│   │   │   ├── account.py
│   │   │   ├── category.py
│   │   │   ├── transaction.py
│   │   │   ├── budget.py
│   │   │   └── dashboard.py
│   │   ├── routes/              # FastAPI REST routers
│   │   │   ├── accounts.py      # Account CRUD & balance synchronization
│   │   │   ├── categories.py    # Category CRUD & safe delete checks
│   │   │   ├── transactions.py  # Transaction CRUD, search, filter, CSV export
│   │   │   ├── budgets.py       # Budget status & utilization calculations
│   │   │   ├── dashboard.py     # Dashboard summary, charts & insights
│   │   │   ├── credit_cards.py  # Credit card tracking & status toggle
│   │   │   └── insurance.py     # Insurance policies & healthcare tracking
│   │   └── services/
│   │       ├── analytics.py     # Dynamic calculation engine & smart tips
│   │       └── export.py        # Streaming CSV generator
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # Realistic multi-month database seed script
│   ├── test_api.py              # Comprehensive automated API test suite
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client wrapper for all REST endpoints
│   │   │   └── client.js
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── TransactionModal.jsx
│   │   │   ├── CategoryModal.jsx
│   │   │   ├── AccountModal.jsx
│   │   │   └── BudgetModal.jsx
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx # Dark/Light theme provider with localStorage
│   │   │   └── ToastContext.jsx # Floating toast notification provider
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx    # Responsive sidebar, drawer & header
│   │   ├── pages/               # Main application views
│   │   │   ├── Dashboard.jsx    # Metric cards, Recharts visualizations, recent activity
│   │   │   ├── Transactions.jsx # Advanced filter toolbar, sorting, table, CSV
│   │   │   ├── Budgets.jsx      # Budget progress bars, alerts & management
│   │   │   ├── Accounts.jsx     # Net worth summary & account cards
│   │   │   ├── Categories.jsx   # Category builder with icons & colors
│   │   │   ├── CreditCards.jsx  # Credit limit, dues & settlement toggle
│   │   │   ├── InsuranceMedical.jsx # Policies, renewal dates & medical costs
│   │   │   └── Insights.jsx     # Real computed analytics & smart tips
│   │   ├── utils/
│   │   │   ├── formatters.js    # Currency (₹ INR), date and time formatters
│   │   │   └── iconMap.jsx      # Dynamic Lucide icon mapping
│   │   ├── App.jsx              # Application routing
│   │   ├── main.jsx             # Entrypoint
│   │   └── index.css            # Tailwind typography & scrollbars
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
├── .gitignore
└── .env.example
```

---

## 🚀 Installation & Running Locally

### Demo Test Manager

After starting the frontend and backend, open **Demo Test Manager** from the sidebar or visit `/demo-tests`. It runs live checks for API health, dashboard data, transactions, accounts, budgets, and the bundled USD 49 receipt scanner.

New expense entries are limited to **Rs 20,000 per transaction**. Existing historical records remain readable.

### Bulk Transaction Import

For large histories, open **Transactions** and choose **Import CSV**. The importer accepts exported CSV files or files with these columns:

```text
Date,Title,Amount,Type,Category,Payment Method,Account,Status,Notes
```

Category and account names must already exist in the app. Up to 5,000 rows can be imported at once; invalid rows are reported, and duplicate rows are skipped automatically.

For a bank statement screenshot, use **Scan Statement** on the Transactions page. The OCR scanner looks for dated transaction lines, creates one history entry per detected line, and places the imported entries at the top. Clear screenshots with visible dates and amounts work best; always review OCR results after importing.

### Vercel Deployment

Deploy the Vite frontend from `Problem-9/frontend` with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE=https://your-backend-host.example.com`

Host the FastAPI backend separately and use its public URL for `VITE_API_BASE`. The local Vite proxy only works during development.

### Prerequisites

- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js v22 LTS)
- **Git**

---

### Step 1: Backend Setup

1. Open a terminal and navigate to the backend directory:

    ```bash
    cd Problem-9/backend
    ```

2. _(Optional but recommended)_ Create and activate a Python virtual environment:
    - **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\activate
        ```
    - **Linux / macOS:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3. Install backend dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. **Seed the database** with rich, realistic demonstration data:

    ```bash
    python seed.py
    ```

    > This seeds 7 accounts (Savings, Demat, Credit Cards, Cash), 18 categories, 39 realistic multi-month transactions, and 8 monthly budgets.

5. Start the FastAPI backend server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    The backend API will start at `http://127.0.0.1:8000`.
    - **Swagger Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
    - **ReDoc API Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 2: Frontend Setup

1. In a second terminal window, navigate to the frontend directory:

    ```bash
    cd Problem-9/frontend
    ```

2. Install npm dependencies:

    ```bash
    npm install
    ```

3. Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend application will start at `http://localhost:5173`.

---

## 🎯 Verification & Automated Tests

To run the automated backend test suite verifying all REST endpoints, calculations, and CSV exports:

```bash
cd Problem-9/backend
python test_api.py
```

Expected output:

```
Testing /api/health ...
[OK] Health check: {'status': 'healthy', 'app': 'Expense Management System API', 'problem': 'Problem 9 - Vexora-26', 'docs': '/docs', 'version': '1.0.0'}
Testing /api/dashboard/summary ...
[OK] Dashboard summary: {'total_balance': 450335.0, 'total_income': 92000.0, 'total_expenses': 89170.0, ...}
Testing /api/dashboard/category-expenses ...
[OK] Category expenses count: 6
Testing /api/dashboard/insights ...
[OK] Financial insights: Spending in 'Mutual Funds & SIP' represents your largest expense outflow this month.
Testing /api/transactions ...
[OK] Transactions total: 39, returned: 10
Testing /api/transactions/export/csv ...
[OK] CSV export verified!
Testing /api/accounts ...
[OK] Accounts count: 7
Testing /api/categories ...
[OK] Categories count: 18
Testing /api/budgets ...
[OK] Budgets count: 8
Testing /api/credit-cards/summary ...
[OK] Credit cards total outstanding: 66087.0
Testing /api/insurance/summary ...
[OK] Insurance total premium: 36300.0

ALL BACKEND API TESTS PASSED SUCCESSFULLY!
```

---

## 📊 Main Features Walkthrough

### 1. Unified Dashboard

- **Dynamic Time Filters**: Switch seamlessly between `This Week`, `This Month`, `Last Month`, `Last 3 Months`, `This Year`, and `All Time`.
- **Summary Cards**: Total Balance, Total Income, Total Expenses, This Month's Expenses, and Transaction Count.
- **Donut Chart**: Category-wise expense percentage with center hover tooltips and legend.
- **Monthly Income vs Expense**: Dual-bar comparison over the past 6 months.
- **Spending Velocity**: Smooth line chart showing cumulative daily outflows.
- **Holdings Snapshot**: Real-time balance preview across Bank, Demat, Cards, and Cash.

### 2. Transaction Management & Advanced Filtering

- **Real CRUD**: Add, edit, delete, and inspect transaction details.
- **Advanced Filtering Toolbar**:
    - Full-text search (Title, category, account, notes).
    - Income / Expense type filter.
    - Category dropdown.
    - Account dropdown.
    - Payment method filter (UPI, Credit Card, Debit Card, Net Banking, Bank Transfer, Cash, Other).
    - Date Range pickers (From and To).
    - Multi-criteria sorting (Newest, Oldest, Amount High-Low, Amount Low-High, Name A-Z, Name Z-A).
    - Active filter count indicator & 1-click "Clear Filters" button.
- **CSV Export**: Instantly exports filtered transactions to a downloadable spreadsheet.

### 3. Credit Card Financial Tracking

- Dedicated credit card dashboard showing total outstanding due across all cards.
- Credit utilization percentage with progress indicators.
- Upcoming statement due date alerts.
- Unpaid vs paid dues count.
- One-click "Mark Paid / Unpaid" toggle for statement settlements.

### 4. Insurance & Healthcare Tracking

- Breakdown of Health Insurance, Life Insurance, Medicines, and Hospital expenses.
- Active policy tracking with annual premium amounts, last payment date, and next renewal due date.
- Dedicated healthcare transaction audit log.

### 5. Monthly & Category Budget Tracking

- Set overall monthly spending limits or category-specific targets.
- Color-coded progress bars:
    - 🟢 **Normal** (<80% used)
    - 🟡 **Warning** (80%–99% used)
    - 🔴 **Danger Alert** (>100% exceeded limit)

### 6. Real Financial Insights Engine

- Highest and lowest spending categories.
- Average daily spending velocity.
- Largest transaction highlight.
- Month-over-Month (MoM) spending change percentage.
- Budget utilization score.
- Most frequent payment mode.
- Algorithmic financial health tips based on current savings rate.

### 7. AI Smart Invoice & Receipt Scanner

- **100% Offline & Free**: Powered by Windows OCR and heuristic NLP algorithms without any paid API keys.
- **Automatic Field Extraction**: Extracts merchant name, total bill amount, transaction date, items, and policy/invoice reference numbers.
- **Accurate Payment Method Classification**: Checks **Debit Card** before Credit Card to prevent misclassification. Debit cards are linked to bank/savings accounts while credit cards are routed to credit liabilities.
- **Instant Demo Bills**: Quick 1-click test buttons for Hackathon judges (Apple Store ₹22,900 INR, Star Health ₹16,500 INR, Cloud Host $49.00 USD Debit, and Berlin Office €85.00 EUR Debit).

### 8. Multi-Currency Support & Live Conversion

- **Universal Currency Detection**: Recognizes international currencies including USD ($), EUR (€), GBP (£), AED, CAD, AUD, SGD, and JPY.
- **Dual Amount Tracking**: Preserves original foreign bill amounts (e.g. `$49.00 USD`) while automatically converting to base INR (₹) using exchange rates for unified financial balance tracking.
- **Multi-Currency Badges**: Highlights original currency across Transactions history, Dashboard, and Digital Receipts.

### 9. Interactive Digital Transaction Receipts

- Click any transaction row on Dashboard or Transactions to inspect a formal electronic audit receipt.
- **Print & PDF Export**: Clean, high-resolution printable receipt styling.
- **Original Receipt Photo**: Inspect attached invoice/receipt photos directly in the modal.
- **1-Click Photo Download**: Download the attached bill image with one click.
- **Clipboard Sharing**: Copy full receipt summary text formatted for Slack, WhatsApp, or email.

### 10. UI/UX Design & Dark Mode

- SaaS-grade interface built with Tailwind CSS.
- Smooth Light / Dark mode toggle persisted in `localStorage`.
- Mobile-responsive layout with collapsible drawer navigation.
- Floating toast notifications for user actions.
- Empty states and validation alerts.

---

## 🔮 Future Roadmap

1. **Account Aggregator (AA) Integration**: Secure automated bank statement synchronization via India's open-banking Account Aggregator framework (Setu / Finvu).
2. **SIP & Demat Portfolio Valuation Sync**: Integration with live market feeds (NSE / BSE) for real-time equity net worth tracking.
3. **Automated WhatsApp Expense Bot**: Log expenses via WhatsApp chat with receipt photo attachments.

---

## 📦 Hackathon Repository Submission Guide

The hackathon organizer has specified:

> "Once your project is built, push your project to this repository:
> **Vexora-26 GitHub Repository**: [https://github.com/satyammahto/Vexora-26](https://github.com/satyammahto/Vexora-26)
> Repository/folder name must be either: **Team Name** OR **Problem Statement Number**"

Strict folder name used: **`Problem-9`**

### Exact Git Commands to Push

1. Clone the hackathon repository:

    ```bash
    git clone https://github.com/satyammahto/Vexora-26.git
    cd Vexora-26
    ```

2. Copy the `Problem-9` folder from your local workspace into the repository:
    - **Windows (PowerShell):**
        ```powershell
        Copy-Item -Path "c:\Users\akash singh\OneDrive\Desktop\expense_management\Problem-9" -Destination ".\Problem-9" -Recurse
        ```
    - **Linux / macOS:**
        ```bash
        cp -r "/path/to/expense_management/Problem-9" ./Problem-9
        ```

3. Verify repository status (ensure no `.env`, `node_modules`, or `__pycache__` are staged):

    ```bash
    git status
    ```

4. Commit and push:
    ```bash
    git add Problem-9/
    git commit -m "Add Problem 9 Expense Management System - Vexora-26"
    git push origin main
    ```
    _(If the repository uses another default branch, verify with `git branch -a` and push to that branch)._

> [!IMPORTANT]
>
> - Do NOT force push (`git push --force`).
> - Do NOT delete or overwrite other teams' folders in `Vexora-26`.
