# GridGuard — Team Task Division (5 Members)

Based on the final locked `SPEC.md` and `CLAUDE.md`. Stack: React (Vite) + TypeScript + Tailwind + shadcn/ui + Recharts, FastAPI, Supabase (Auth + PostgreSQL), Claude API (summaries only), deployed on Vercel/Railway/Supabase.

Each member should keep `SPEC.md` and `CLAUDE.md` open/referenced when prompting Claude Code, and follow the milestone order from `CLAUDE.md`'s Development Workflow within their own area.

---

## Member 1 — Frontend: Scaffold, Layout & Grid Tree Navigation
**Owns:** `frontend/src/components/layout/`, `frontend/src/components/common/`, Grid Tree, routing

**Responsibilities**
- React + Vite + TypeScript project scaffold, following the exact folder structure in `CLAUDE.md`
- React Router setup and page structure
- Sidebar, top navigation, and overall dashboard shell
- The **Grid Tree** component: Grid → Zone → Transformer hierarchy, expandable, selecting a transformer routes to its detail view
- Dark, modern utility-dashboard styling with Tailwind + shadcn/ui

**Workflow**
1. Scaffold the project exactly per `CLAUDE.md`'s frontend folder structure (`src/assets, components, hooks, lib, pages, services, types, utils`).
2. Set up React Router with routes for login, dashboard, and transformer detail.
3. Build the sidebar + top nav shell.
4. Build the Grid Tree component with mock zone/transformer data, wired to navigate to a transformer's detail page on selection.
5. Push to `feature/scaffold-grid-tree` branch, PR into `main`.

**Prompts to give Claude Code**
- "Read CLAUDE.md and SPEC.md. Scaffold a React + Vite + TypeScript project with Tailwind CSS and shadcn/ui, using the exact frontend folder structure defined in CLAUDE.md."
- "Set up React Router with routes for /login, /dashboard, and /transformer/:id."
- "Build a sidebar and top navigation shell for a dark-themed utility operations dashboard, per the UI Guidelines in CLAUDE.md."
- "Build a Grid Tree component (Grid → Zone → Transformer) as shown in CLAUDE.md's UI Guidelines example, expandable, where selecting a transformer navigates to its detail page. Use mock data for now."

---

## Member 2 — Frontend: Dashboard, Transformer Details, Charts & Alerts UI
**Owns:** `frontend/src/components/dashboard/`, `frontend/src/components/transformer/`, `frontend/src/components/charts/`, `frontend/src/components/alerts/`

**Responsibilities**
- Dashboard page: system summary, active alerts, transformer overview, recent telemetry, prediction status
- Transformer Details view/drawer: ID, current load, predicted load, voltage, current, temperature, health status, last updated
- **Historical Load Trend Chart** using Recharts (recent load history + predicted trend line)
- Alert banners/notifications for critical transformers
- AI summary display area within Transformer Details (renders text from Member 5's `ai_reporter.py` endpoint)

**Workflow**
1. Wait for Member 1's layout/routing to stabilize; build inside it.
2. Build the Dashboard page with summary cards and an alert panel, using mock data.
3. Build the Transformer Details view with all required fields.
4. Build the Recharts trend chart component (load history + predicted line) and place it in Transformer Details.
5. Build alert banner components triggered by `health_status === 'critical'`.
6. Add a summary panel in Transformer Details that displays the AI-generated text once Member 5's endpoint is live.
7. Push to `feature/dashboard-charts-alerts` branch, PR into `main`.

**Prompts to give Claude Code**
- "Read CLAUDE.md. Build a Dashboard page with summary cards, an active alerts panel, and a transformer overview section, using mock data."
- "Build a Transformer Details component/drawer showing Transformer ID, Current Load, Predicted Load, Voltage, Current, Temperature, Health Status, and Last Updated, matching CLAUDE.md's UI Guidelines."
- "Build a Recharts line chart component in components/charts/ showing recent load history alongside the predicted trend line, per the Historical Load Trend Chart feature in SPEC.md. Keep it to one chart, one transformer at a time."
- "Build an alert banner component that appears when a transformer's health_status is 'critical', styled to match the dark theme."
- "Add a section to Transformer Details that displays an AI-generated operator summary (plain text from the backend) only for critical transformers."

---

## Member 3 — Backend: Auth, Database Schema & API Layer
**Owns:** `backend/auth/`, `backend/database/`, `backend/models/`, `backend/schemas/`, `backend/api/routes/`

**Responsibilities**
- FastAPI project scaffold, following the exact folder structure in `CLAUDE.md`
- Supabase Auth integration: login/logout, protected routes, backend JWT verification
- Supabase PostgreSQL schema — Phase 1: `User`, `Transformer`, `Telemetry`; Phase 2: `Alert`
- REST API routes: `GET /transformers`, `GET /transformers/{id}`, `GET /transformers/{id}/telemetry`, `GET /alerts`

**Workflow**
1. Scaffold the FastAPI backend exactly per `CLAUDE.md`'s folder structure (`api/routes, auth, database, models, schemas, services, utils, main.py`).
2. Implement Supabase Auth verification as a FastAPI dependency protecting relevant routes.
3. Design and create the Phase 1 database schema (User, Transformer, Telemetry) in Supabase.
4. Build REST routes that return data from Member 4's generator/predictor services (stub with sample data until those are ready).
5. Once Member 5's `alert_manager.py` exists, add the Phase 2 `Alert` model and `GET /alerts` route.
6. Push to `feature/backend-auth-api` branch, PR into `main`.

**Prompts to give Claude Code**
- "Read CLAUDE.md. Scaffold a FastAPI backend using the exact folder structure defined (api/routes, auth, database, models, schemas, services, utils, main.py)."
- "Implement a FastAPI dependency that verifies a Supabase Auth JWT and protects routes, per the Authentication section in CLAUDE.md. Do not implement custom authentication."
- "Design the Phase 1 Supabase PostgreSQL schema for User, Transformer, and Telemetry per the Database section in CLAUDE.md and SPEC.md, and set up the connection."
- "Build GET /transformers, GET /transformers/{id}, and GET /transformers/{id}/telemetry routes in api/routes/, keeping business logic inside services/ and routes lightweight."
- "Once the Alert model exists, add GET /alerts to return active alerts."

---

## Member 4 — Backend: Telemetry Generator & Prediction Engine
**Owns:** `backend/services/generator.py`, `backend/services/predictor.py`

**Responsibilities**
- Simulated telemetry generator: periodically produces realistic load, voltage, current, and temperature readings per transformer
- Deterministic prediction engine: moving average / linear regression forecasting, threshold-based health status
- No machine learning — per `SPEC.md`, this must stay explainable and deterministic

**Workflow**
1. Build `generator.py`: a service that creates/updates simulated telemetry for each transformer on an interval, writing to the Telemetry table (via Member 3's schema).
2. Build `predictor.py`: takes recent telemetry history for a transformer, computes a trend line, forecasts future load, and estimates overload risk.
3. Implement the threshold logic that maps current + predicted load to `healthy` / `warning` / `critical`.
4. Coordinate with Member 3 to plug this into the `GET /transformers` response (current + predicted load + health status).
5. Push to `feature/prediction-engine` branch, PR into `main`.

**Prompts to give Claude Code**
- "Read CLAUDE.md and SPEC.md. Write generator.py in backend/services/ — a simulated telemetry generator that periodically updates load, voltage, current, and temperature for each transformer with realistic fluctuation, and writes to the database."
- "Write predictor.py in backend/services/ — a deterministic prediction engine using moving average and/or linear regression on recent telemetry history to forecast future load. No machine learning, per SPEC.md's Non-Goals."
- "Add threshold logic to predictor.py that computes health_status (healthy/warning/critical) from current and predicted load, keeping the logic simple and explainable."
- "Write a small test script that feeds predictor.py a steadily rising trend and confirms it correctly predicts an approaching threshold crossing."

---

## Member 5 — Backend: Alerts, AI Operator Summary & Deployment
**Owns:** `backend/services/alert_manager.py`, `backend/services/ai_reporter.py`, deployment configs, `.env.example`, README

**Responsibilities**
- `alert_manager.py`: evaluates predictions from Member 4's `predictor.py` against thresholds and raises/stores alerts
- `ai_reporter.py`: calls the Claude API to generate a plain-English operator summary for critical alerts only — pure text generation, no decision-making power (per `CLAUDE.md`'s Boundaries)
- Deployment: Vercel (frontend), Railway (backend), Supabase (database/auth)
- Environment variable setup (`.env.example`) and final README/documentation
- End-to-end verification against the "Definition of Done" in `SPEC.md`

**Workflow**
1. Build `alert_manager.py`: watches/evaluates prediction output and raises an `Alert` record when a transformer crosses into warning/critical (works with Member 3's Phase 2 schema).
2. Build `ai_reporter.py`: on a critical alert, sends the transformer's current + predicted telemetry to the Claude API and returns a short operator-facing summary string. Confirm with the team it cannot alter health status, alerts, or prediction values.
3. Wire the AI summary into an endpoint Member 2's frontend can call/display.
4. Set up `.env.example` listing Supabase and Claude API variables (frontend `VITE_` vars, backend vars) per `CLAUDE.md`'s Environment Variables section.
5. Deploy: backend to Railway, frontend to Vercel, confirm all env vars are set correctly on each platform.
6. Run through the full "Definition of Done" checklist in `SPEC.md`, then write the README.
7. Push to `feature/alerts-ai-deployment` branch, PR into `main`.

**Prompts to give Claude Code**
- "Read CLAUDE.md and SPEC.md. Write alert_manager.py in backend/services/ that evaluates predictor.py's output against thresholds and raises an Alert record when a transformer becomes warning or critical."
- "Write ai_reporter.py in backend/services/ that calls the Claude API to generate a short, plain-English operator summary for a critical alert, using the transformer's current and predicted telemetry as input. It must only return text — it cannot modify health_status, alerts, or predictions, per CLAUDE.md's Boundaries."
- "Create a .env.example listing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CLAUDE_API_KEY, without real values, per CLAUDE.md's Environment Variables section."
- "Review the project against the Definition of Done checklist in SPEC.md and list anything missing."
- "Write a README.md covering setup instructions, architecture overview, and how to run the project locally and in production."

---

## Coordination Notes
- **Milestone order matters.** `CLAUDE.md` specifies: Scaffold → Auth → Database → Telemetry Generator → Prediction Engine → Dashboard → Alerts → Trend Chart → AI Summary → Deployment → Polish. Members 3 and 4 unblock nearly everyone else — prioritize getting a basic schema + stubbed API responses out early so Members 1, 2, and 5 aren't blocked.
- **Branch naming**: `feature/<short-name>`. Never push directly to `main`, per `CLAUDE.md`'s Git Workflow.
- **Shared source of truth**: any change to the Transformer/Telemetry/Alert data shape must be updated in `CLAUDE.md` and `SPEC.md` first, then propagated to Supabase schema, Pydantic schemas, and frontend TypeScript types.
- **AI boundary is non-negotiable**: `ai_reporter.py` only generates explanatory text. It must never be given write access to health status, predictions, or alerts — this is explicitly called out in `CLAUDE.md`'s Boundaries and AI Assistant Instructions, and should be treated as a hard rule, not a suggestion.
- **No ML**: per `SPEC.md`'s Non-Goals, Member 4's prediction engine must stay deterministic (moving average / linear regression + thresholds) — no scikit-learn, no trained models, for this MVP.
