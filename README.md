# GridGuard

GridGuard is a web-based predictive grid monitoring platform for Electricity Distribution Companies (DISCOMs). It uses simulated transformer telemetry and a deterministic prediction engine to forecast overload conditions before they become critical, giving grid control room operators early warning and time to take preventive action.

GridGuard is a decision-support platform. It complements existing SCADA monitoring and does not replace it, and it does not perform real SCADA integration or automatic transformer control.

Full product requirements live in [SPEC.md](SPEC.md). Engineering conventions live in [CLAUDE.md](CLAUDE.md).

## Status

**Complete MVP** — All core features implemented and integrated:
- ✅ Authentication (Supabase Auth)
- ✅ Database (Supabase PostgreSQL — User, Transformer, Telemetry, Alert)
- ✅ Telemetry Generator (realistic simulated load data)
- ✅ Prediction Engine (deterministic load forecasting)
- ✅ Alert System (threshold-based warnings and critical alerts)
- ✅ AI Operator Summary (Claude API for critical alerts)
- ✅ Dashboard & Grid Tree UI (React + Tailwind)
- ✅ Historical Load Trend Chart (Recharts)
- ✅ API Integration (live predictions, real telemetry)

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

## Deployment

GridGuard is deployed across three platforms:

### Database (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run migrations to create tables (User, Transformer, Telemetry, Alert)
3. Copy the project URL and service role key to your environment variables
4. Create initial transformer records in the database (e.g., T-101, T-102, etc. in different zones)

### Frontend (Vercel)

1. Push your code to GitHub
2. Create a new Vercel project connected to your GitHub repo
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` — from Supabase dashboard
   - `VITE_SUPABASE_ANON_KEY` — from Supabase dashboard (public key, safe for frontend)
4. Deploy — Vercel will auto-build on every push to main

### Backend (Railway)

1. Create a Railway project at [railway.app](https://railway.app)
2. Connect your GitHub repo to Railway
3. Railway will auto-detect the Dockerfile and deploy
4. Set environment variables in Railway dashboard:
   - `SUPABASE_URL` — Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (backend-only)
   - `SUPABASE_JWT_SECRET` — JWT secret from Supabase
   - `DATABASE_URL` — PostgreSQL connection string from Supabase
   - `CLAUDE_API_KEY` — from Anthropic console (optional, fallback works without it)
5. Deploy — Railway will auto-build and start the FastAPI server

### Environment Variables

**Frontend** (`.env` or Vercel dashboard):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend** (`.env` or Railway dashboard):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://user:password@host:port/database
CLAUDE_API_KEY=sk-ant-...  # optional
```

⚠️ **Security**: Never commit real credentials to git. Use platform dashboards (Vercel, Railway) to set secrets in production.

## Architecture

### Telemetry Generation

The backend runs a continuous `TelemetryGenerator` that:
- Simulates realistic transformer load using a mean-reverting random walk
- Derives voltage, current, and temperature from load using transformer physics
- Writes readings to the Telemetry table every 5 seconds
- Starts automatically when the FastAPI server starts

### Prediction Engine

`predictor.py` provides deterministic load forecasting:
- Uses linear regression on recent telemetry history to forecast future load
- Falls back to moving average if insufficient history
- Computes health status by comparing current + predicted load against thresholds (90% warning, 100% critical)
- Returns LoadForecast with method, horizon, and health classification

### Alert System

`alert_manager.py` evaluates predictions:
- Triggers an alert when health status becomes warning or critical
- Prevents duplicate alerts at the same level
- Stores alert reason, telemetry snapshot, and timestamps

### AI Operator Summary

For critical alerts, `ai_reporter.py` calls Claude API to generate:
- Plain-English explanation of the situation
- Recommended operator action
- Falls back to hardcoded summary if API unavailable

The AI **never makes decisions** — it only explains what the prediction engine already decided.

## API Endpoints

### Transformers
- `GET /transformers` — List all transformers with live predictions
- `GET /transformers/{id}` — Get a single transformer
- `GET /transformers/{id}/telemetry` — Get recent telemetry history

### Alerts
- `GET /alerts/active` — List all unresolved alerts
- `POST /alerts/{transformer_id}/evaluate` — Manually trigger alert evaluation
- `PATCH /alerts/{alert_id}/resolve` — Mark alert as resolved
- `POST /alerts/{alert_id}/ai-summary` — Generate AI summary for a critical alert

All endpoints require authentication (Supabase JWT token).
