@echo off
title Expense Management System - Vexora-26 Problem 9
echo =======================================================
echo    Expense Management System (Problem 9 - Vexora-26)
echo =======================================================
echo.

cd /d "%~dp0backend"
if not exist "expense_tracker.db" (
    echo [1/2] Database not found. Seeding database with demo data...
    python seed.py
) else (
    echo [1/2] Existing database found (expense_tracker.db). Preserving all your transactions and receipts!
)

echo.
echo [2/2] Starting server at http://127.0.0.1:8000 ...
echo - App UI: http://127.0.0.1:8000
echo - Swagger API Docs: http://127.0.0.1:8000/docs
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
