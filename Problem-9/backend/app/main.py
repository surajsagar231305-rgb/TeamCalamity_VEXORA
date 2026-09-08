from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
import app.models  # Ensures all models are imported before create_all
from app.demo_data import ensure_demo_data
from app.routes import (
    accounts_router,
    categories_router,
    transactions_router,
    budgets_router,
    dashboard_router,
    credit_cards_router,
    insurance_router,
)

# Create database tables
Base.metadata.create_all(bind=engine)
with SessionLocal() as startup_db:
    ensure_demo_data(startup_db)

app = FastAPI(
    title="Expense Management System API",
    description="Backend REST API for Problem 9 (Vexora-26 Hackathon) - Unified Expense Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(accounts_router)
app.include_router(budgets_router)
app.include_router(credit_cards_router)
app.include_router(insurance_router)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": "Expense Management System API",
        "problem": "Problem 9 - Vexora-26",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Mount uploads directory for receipts and bills
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Check if frontend/dist exists to serve unified web application
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    # Mount assets
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Allow /docs, /redoc, /openapi.json to pass through
        if full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "openapi.json":
            return None
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/", tags=["Health"])
    def root_health():
        return health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
