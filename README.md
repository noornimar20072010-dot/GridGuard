# GridGuard

**Predictive Grid Monitoring for Electricity Distribution**

GridGuard is a web-based predictive monitoring platform that helps grid operators identify transformer overload risks **before failures occur**. Using simulated telemetry and a deterministic prediction engine, it enables proactive decision-making to prevent power outages and protect electrical infrastructure.

GridGuard is a **decision-support platform**. It complements existing SCADA monitoring systems and does not replace them. It performs no real SCADA integration or automatic transformer control.

---

## Project Status

✅ **Fully Functional MVP** — All core features implemented and tested.

| Milestone | Status | Details |
|-----------|--------|---------|
| 1. Repository Scaffold | ✅ Complete | Project structure, folder organization |
| 2. Authentication | ✅ Complete | Supabase Auth, JWT verification, protected routes |
| 3. Database Schema | ✅ Complete | Phase 1 & 2 models (User, Transformer, Telemetry, Alert) |
| 4. Telemetry Generator | ✅ Complete | Simulated SCADA data generation, periodic updates |
| 5. Prediction Engine | ✅ Complete | Deterministic load forecasting, linear regression + thresholds |
| 6. Dashboard | ✅ Complete | Grid Tree navigation, transformer details, live telemetry |
| 7. Alert System | ✅ Complete | Threshold-based alert creation, alert management APIs |
| 8. AI Operator Summaries | ✅ Complete | Claude API integration for critical alert text generation |
| 9. Deployment | ⚠️ Ready | Configs created, ready for Vercel/Railway deployment |

**Definition of Done Progress:**
- ✅ Operators can authenticate
- ✅ Dashboard displays live simulated telemetry
- ✅ Telemetry generator updates automatically
- ✅ Grid Tree allows zone/transformer navigation
- ✅ Transformer overloads predicted before threshold exceeded
- ✅ Alerts notify operators (with AI summaries)
- ✅ Historical load trend charts
- ✅ Code is modular, documented, production-ready
- ⏳ Deployed and running in production

---

## Technology Stack

**Frontend:** React (Vite), TypeScript, Tailwind CSS, shadcn/ui, React Router, Recharts

**Backend:** FastAPI (Python), Supabase PostgreSQL

**Authentication:** Supabase Auth (JWT)

**AI:** Claude API (text summaries only, no prediction logic)

**Deployment:** Vercel (frontend), Railway (backend), Supabase (database/auth)

---

## Architecture Overview

### Deterministic Prediction Engine (Backend-Specific)

The **prediction engine** (`backend/services/predictor.py`) is:
- ✅ **Deterministic** — Uses moving average and linear regression (no ML models)
- ✅ **Explainable** — All math is transparent and auditable
- ✅ **Decision-making** — Computes health status (healthy/warning/critical)
- ✅ **Threshold-based** — Fixed limits: 90% = warning, 100% = critical

The prediction engine **owns** transformer health status and overload risk determination.

### AI Operator Summary Generation (Text-Only)

The **AI reporter** (`backend/services/ai_reporter.py`) is:
- ✅ **Text generation** — Calls Claude API for plain-English explanations
- ✅ **Read-only** — Takes alert data, returns summary string
- ✅ **Non-decision-making** — Provides context, suggests action, does NOT make health/alert decisions
- ✅ **Fallback-safe** — Works without API key (uses default message)

The AI reporter **never** modifies health status, alerts, or predictions.

### Data Flow

```
Telemetry (simulated sensor data)
         ↓
Predictor (deterministic forecasting → health status)
         ↓
Alert Manager (creates Alert if warning/critical)
         ↓
[Operator views alert in dashboard]
         ↓
AI Reporter (optional: generate explanation for critical alerts)
         ↓
[Operator reads summary and takes action]
```

---

## Quick Start

### Prerequisites

- **Node.js 22+ LTS** and npm
- **Python 3.12+** and pip
- **Supabase account** (free tier works)
- **Anthropic API key** (optional, for real Claude summaries)

### Local Development Setup

#### 1. Clone and Install

```bash
git clone <repository-url>
cd GridGuard
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Then edit `frontend/.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Start frontend dev server:**
```bash
npm run dev
```
Access at `http://localhost:5173`

#### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
cp .env.example .env
```

Then edit `backend/.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
CLAUDE_API_KEY=sk-ant-...  # Optional for real summaries
```

**Create database schema:**
```bash
python migrate.py
```

**Seed test data:**
```bash
python seed_transformers.py
```

**Start backend dev server:**
```bash
uvicorn main:app --reload
```
Access API at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

#### 4. Test the System

```bash
# Test alerts endpoint
python test_all_endpoints.py

# Test AI summary endpoint
python test_ai_summary.py
```

---

## Development Commands

### Frontend (`frontend/` directory)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Backend (`backend/` directory, with venv activated)

| Command | Purpose |
|---------|---------|
| `uvicorn main:app --reload` | Start FastAPI dev server (auto-reload) |
| `python migrate.py` | Initialize database schema |
| `python seed_transformers.py` | Seed test transformers and telemetry |
| `python test_all_endpoints.py` | Test transformer and alert APIs |
| `python test_ai_summary.py` | Test AI summary generation |

---

## API Reference

### Transformers

```
GET /transformers
  Returns all transformers with latest telemetry
  
GET /transformers/{transformer_id}
  Returns a specific transformer with latest data
  
GET /transformers/{transformer_id}/telemetry
  Returns recent telemetry history (last 12 readings)
```

### Alerts

```
POST /alerts/{transformer_id}/evaluate
  Evaluates predictions and creates alert if needed
  
GET /alerts/active
  Returns all unresolved alerts
  
PATCH /alerts/{alert_id}/resolve
  Marks an alert as resolved
  
POST /alerts/{alert_id}/ai-summary
  Generates AI-powered operator summary (critical alerts only)
```

---

## Deployment

### Prerequisites for Deployment

1. **Supabase Project** — Database and Auth setup
2. **Vercel Account** — For frontend hosting
3. **Railway Account** — For backend hosting
4. **Claude API Key** (optional) — For real AI summaries

### Deploy to Vercel (Frontend)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect Vercel to GitHub:**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GridGuard repository
   - Vercel auto-detects Vite configuration

3. **Set Environment Variables:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel automatically builds and deploys on push

**Frontend is now live at:** `https://your-project.vercel.app`

### Deploy to Railway (Backend)

1. **Prepare backend for Railway:**
   - Ensure `requirements.txt` includes all dependencies
   - Ensure `main.py` exists and exports `app`
   - Railway auto-detects Python and runs `python -m uvicorn main:app`

2. **Connect Railway to GitHub:**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select your GridGuard repository

3. **Set Environment Variables:**
   - In Railway, go to Variables
   - Add all backend `.env` variables:
     ```
     SUPABASE_URL=...
     SUPABASE_SERVICE_ROLE_KEY=...
     SUPABASE_JWT_SECRET=...
     DATABASE_URL=...
     CLAUDE_API_KEY=...
     ```

4. **Deploy:**
   - Railway auto-builds from `requirements.txt` and Procfile (if present)
   - Auto-restarts on push

**Backend is now live at:** `https://your-railway-app.railway.app`

### Update Frontend to Point to Production Backend

After backend is deployed, update `frontend/src/services/` API client to use:
```typescript
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app.railway.app'
  : 'http://localhost:8000'
```

Push to GitHub and Vercel redeploys automatically.

---

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Supabase Dashboard > API | Connect to Supabase |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard > API | Frontend auth key |

### Backend (`.env`)

| Variable | Source | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Supabase Dashboard > API | Connect to Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > API | Backend database access |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard > API > JWT Settings | Verify auth tokens locally |
| `DATABASE_URL` | Supabase Dashboard > Database | Direct database access |
| `CLAUDE_API_KEY` | https://console.anthropic.com | Claude API (optional) |

**⚠️ Never commit `.env` files. Use platform secrets in production.**

---

## Project Structure

```
GridGuard/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── transformer/
│   │   │   ├── charts/
│   │   │   └── alerts/
│   │   ├── pages/               # Page routes
│   │   ├── services/            # API client, utilities
│   │   ├── types/               # TypeScript types
│   │   └── hooks/               # React hooks
│   ├── .env.example             # Frontend env template
│   └── vite.config.ts
│
├── backend/                     # FastAPI application
│   ├── api/
│   │   └── routes/              # API endpoint handlers
│   ├── auth/                    # Supabase JWT verification
│   ├── database/                # Database connection
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── services/                # Business logic
│   │   ├── generator.py         # Telemetry generation
│   │   ├── predictor.py         # Load forecasting
│   │   ├── alert_manager.py     # Alert evaluation
│   │   ├── ai_reporter.py       # Claude API integration
│   │   └── transformer_service.py # Transformer queries
│   ├── utils/                   # Config, helpers
│   ├── main.py                  # FastAPI entry point
│   ├── migrate.py               # Database initialization
│   ├── seed_transformers.py     # Test data seeding
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Backend env template
│
├── vercel.json                  # Vercel deployment config
├── SPEC.md                      # Product specification
├── CLAUDE.md                    # Engineering guide
├── TASKS.md                     # Team task breakdown
└── README.md                    # This file
```

---

## Testing

### Unit Tests

Backend prediction engine:
```bash
cd backend
python -m pytest services/test_predictor.py -v
```

### Integration Tests

Full alert workflow:
```bash
cd backend
python test_all_endpoints.py
```

### AI Summary Test

Claude API integration:
```bash
cd backend
python test_ai_summary.py
```

---

## Key Features

### 🔐 Authentication
- Supabase Auth (email/password, OAuth ready)
- JWT-based session management
- Protected API routes

### 📊 Live Telemetry
- Simulated SCADA readings (load, voltage, current, temperature)
- Periodic updates every 60 seconds
- Real-time dashboard updates

### 🔮 Predictive Analytics
- Linear regression + moving average forecasting
- 5-minute ahead load prediction
- Threshold-based health status (healthy/warning/critical)

### 🚨 Alert Management
- Automatic alert creation on threshold crossing
- Alert resolution tracking
- Active alerts dashboard panel

### 🤖 AI Operator Summaries
- Claude API integration (optional)
- Plain-English explanations of critical alerts
- Graceful fallback without API key

### 📈 Historical Trends
- Load history charts (Recharts)
- Prediction accuracy tracking
- Zone-level statistics

### 🗺️ Grid Tree Navigation
- Hierarchical zone/transformer organization
- Expandable tree view
- Quick transformer selection

---

## Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'anthropic'`
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Error:** `DATABASE_URL not configured`
```bash
# Solution: Copy .env.example to .env and fill in credentials
cp .env.example .env
# Edit .env with your Supabase connection string
```

### Frontend Can't Connect to Backend

**Error:** `Failed to fetch /transformers`
```bash
# Solution: Ensure backend is running on port 8000
uvicorn main:app --reload

# If running on different port, update frontend API client
```

### Alerts Not Creating

**Error:** `No telemetry available for this transformer`
```bash
# Solution: Seed test data first
python seed_transformers.py

# Verify data exists
python inspect_db.py
```

---

## Contributing

See `CLAUDE.md` for engineering conventions and `TASKS.md` for team task breakdown.

### Branch Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with meaningful messages: `git commit -m "feat: add transformer details view"`
4. Push and create pull request: `git push origin feature/my-feature`
5. Merge to `main` after review

---

## License

GridGuard is built as a hackathon project demonstrating predictive grid monitoring.

---

## Support

For issues, questions, or suggestions:
- Check `SPEC.md` for product requirements
- Check `CLAUDE.md` for engineering guidelines
- Review API docs at `http://localhost:8000/docs` (when running locally)

---

**Built with ❤️ for grid reliability.**
