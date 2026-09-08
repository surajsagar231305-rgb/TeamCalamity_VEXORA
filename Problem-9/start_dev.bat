@echo off
title Frontend Vite Dev Server - Expense Management
echo =======================================================
echo    Starting Vite Dev Server (React + Tailwind CSS)
echo =======================================================
echo.

set "PATH=C:\Users\akash singh\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo Starting dev server at http://localhost:5173 ...
npm run dev
pause
