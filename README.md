# GridGuard

GridGuard is a web-based predictive grid monitoring platform for Electricity Distribution Companies (DISCOMs). It uses simulated transformer telemetry and a deterministic prediction engine to forecast overload conditions before they become critical, giving grid control room operators early warning and time to take preventive action.

GridGuard is a decision-support platform. It complements existing SCADA monitoring and does not replace it, and it does not perform real SCADA integration or automatic transformer control.

Full product requirements live in [SPEC.md](SPEC.md). Engineering conventions live in [CLAUDE.md](CLAUDE.md).

## Status

**Milestone 1 (Project Scaffold)** — repository structure only. No authentication, database, telemetry, prediction, alerting, or AI features are implemented yet.

## Technology Stack

**Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui, React Router, Recharts

**Backend:** FastAPI (Python)

**Database:** Supabase PostgreSQL

**Authentication:** Supabase Auth

**AI:** Claude API (used only to generate plain-English operator summaries for critical alerts — never to make prediction or health-status decisions)

**Deployment:** Frontend on Vercel, backend on Railway, database on Supabase

## Folder Structure

```
frontend/
└── src/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   ├── dashboard/
    │   ├── transformer/
    │   ├── charts/
    │   ├── alerts/
    │   └── ui/
    ├── hooks/
    ├── lib/
    ├── pages/
    ├── services/
    ├── types/
    └── utils/

backend/
├── api/
│   └── routes/
├── auth/
├── database/
├── models/
├── schemas/
├── services/
│   ├── generator.py       # simulated telemetry generation
│   ├── predictor.py       # deterministic load forecasting
│   ├── alert_manager.py   # threshold evaluation and alerting
│   └── ai_reporter.py     # Claude API operator summaries
├── utils/
└── main.py
```

## Local Setup

### Prerequisites

- Node.js 22 LTS and npm
- Python 3.12

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your Supabase credentials
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env       # then fill in your Supabase/Claude credentials
```

## Development Commands

### Frontend (from `frontend/`)

| Command           | Description                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite dev server           |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run Oxlint                          |

### Backend (from `backend/`, with `venv` activated)

| Command                          | Description                     |
| --------------------------------- | -------------------------------- |
| `uvicorn main:app --reload`      | Start the FastAPI dev server     |

The interactive API docs are available at `http://127.0.0.1:8000/docs` once the server is running.
