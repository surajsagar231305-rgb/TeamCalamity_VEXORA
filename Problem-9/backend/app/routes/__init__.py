from app.routes.accounts import router as accounts_router
from app.routes.categories import router as categories_router
from app.routes.transactions import router as transactions_router
from app.routes.budgets import router as budgets_router
from app.routes.dashboard import router as dashboard_router
from app.routes.credit_cards import router as credit_cards_router
from app.routes.insurance import router as insurance_router

__all__ = [
    "accounts_router",
    "categories_router",
    "transactions_router",
    "budgets_router",
    "dashboard_router",
    "credit_cards_router",
    "insurance_router",
]
