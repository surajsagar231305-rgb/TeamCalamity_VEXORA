# Vexora-26 — Problem 9 Workspace
## Expense Management System

The complete hackathon project is organized inside the **`Problem-9/`** directory to strictly follow the organizer's submission guidelines for `https://github.com/satyammahto/Vexora-26`.

### Quick Access
- Full Application Code & Documentation: [Problem-9/README.md](Problem-9/README.md)
- Backend API Directory: [Problem-9/backend/](Problem-9/backend/)
- Frontend React Directory: [Problem-9/frontend/](Problem-9/frontend/)

### To Start the Application:
```bash
# Backend (FastAPI + SQLite)
cd Problem-9/backend
python seed.py
uvicorn app.main:app --reload --port 8000

# Frontend (React + Vite)
cd Problem-9/frontend
npm run dev
```

Visit:
- Frontend UI: `http://localhost:5173`
- Backend Swagger Docs: `http://127.0.0.1:8000/docs`
