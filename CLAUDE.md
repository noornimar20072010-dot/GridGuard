# CLAUDE.md

# GridGuard Engineering Guide

This document defines the engineering rules for GridGuard.

Product requirements are defined in **SPEC.md**.

If this document conflicts with SPEC.md, ask for clarification rather than making assumptions.

---

# Development Philosophy

GridGuard is a hackathon MVP that demonstrates predictive transformer monitoring using simulated telemetry.

Prioritize:

- Simplicity
- Readability
- Maintainability
- Modularity
- Incremental development

Prefer the simplest implementation that satisfies SPEC.md.

Avoid premature optimization and unnecessary abstractions.

---

# Development Workflow

Build the project milestone by milestone.

Each milestone should leave the project in a working state.

Recommended order:

1. Repository Scaffold
2. Authentication
3. Database
4. Telemetry Generator
5. Prediction Engine
6. Dashboard
7. Alerts
8. Historical Trend Chart
9. AI Operator Summary
10. Deployment
11. Polish

Never combine multiple milestones unless explicitly requested.

---

# Technology Stack

## Frontend

- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Recharts

## Backend

- FastAPI (Python)

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

## AI

- Claude API — used only to generate operator summaries and incident reports for critical alerts.
- Claude does not decide health status or overload risk. That decision is made entirely by the deterministic prediction engine.

## Deployment

- Frontend: Vercel
- Backend: Railway
- Database: Supabase

Use only these technologies unless instructed otherwise.

---

# Coding Standards

Frontend

- Enable TypeScript strict mode.
- Build reusable React components.
- Keep components focused and small.
- Use descriptive names.
- Keep business logic out of UI components.

Backend

- Organize business logic inside services.
- Keep routes lightweight.
- Separate models and schemas.
- Use Python type hints where practical.

General

- Prefer readability over cleverness.
- Avoid duplicated code.
- Keep files small.
- Comment only when logic is not obvious.
- Do not refactor unrelated code.

---

# Folder Structure

Frontend

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
```

Backend

```
backend/
├── api/
│   └── routes/
├── auth/
├── database/
├── models/
├── schemas/
├── services/
├── utils/
└── main.py
```

Only introduce new folders when the project genuinely requires them.

---

# UI Guidelines

The interface should resemble a modern utility operations dashboard.

Main layout:

- Sidebar
- Top navigation
- Summary cards
- Alert panel
- Transformer table
- Grid Tree
- Transformer Details

The Grid Tree replaces geographic maps.

Example:

```
Grid
├── Zone A
│   ├── Transformer T-101
│   ├── Transformer T-102
│   └── Transformer T-103
│
└── Zone B
    ├── Transformer T-201
    └── Transformer T-202
```

Selecting a transformer should display its details, live telemetry, a historical load trend chart, and — for critical transformers — an AI-generated summary.

Avoid unnecessary animations or decorative effects.

---

# Services

The backend should contain these service modules:

- generator.py — simulated telemetry generation
- predictor.py — deterministic load forecasting (moving average / linear regression + thresholds)
- alert_manager.py — evaluates predictions against thresholds and raises alerts
- ai_reporter.py — calls the Claude API to turn a critical alert's data into a plain-English operator summary; contains no prediction logic itself

Each service should have a single responsibility.

---

# Database

Implement incrementally.

Phase 1

- User
- Transformer
- Telemetry

Phase 2

- Alert

Only add additional models when required by future milestones.

---

# API Guidelines

Expose functionality through REST APIs.

Keep business logic inside services.

Keep request and response schemas explicit.

Avoid placing business logic inside route handlers.

---

# Authentication

Use Supabase Auth.

Protect dashboard routes.

Verify authenticated users in the backend where required.

Do not implement custom authentication.

---

# Environment Variables

## Frontend

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Backend

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CLAUDE_API_KEY

Never commit real values. Use `.env` locally and platform secrets (Vercel/Railway/Supabase) in deployment.

---

# AI Assistant Instructions

When generating code:

- Follow SPEC.md.
- Complete only the requested milestone.
- Produce production-quality code for that milestone.
- Preserve the existing project structure.
- Explain important architectural decisions briefly.
- Keep implementations simple and maintainable.
- When implementing `ai_reporter.py`, treat the Claude API call as a pure text-generation step — it receives already-computed telemetry and prediction data, and returns a summary string. It must not be given the ability to alter health status, alerts, or prediction values.

If uncertain, choose the simpler solution.

---

# Boundaries

Do NOT:

- Replace the technology stack.
- Introduce unnecessary libraries.
- Add features outside SPEC.md.
- Redesign the architecture without approval.
- Claim real SCADA integration.
- Claim automatic transformer control.
- Use Claude (or any AI/ML model) to make the overload prediction or health status decision — that logic must remain deterministic and explainable.

GridGuard is a predictive decision-support platform only.

---

# Definition of Success

A milestone is complete when:

- The project compiles successfully.
- Imports resolve correctly.
- The requested feature works.
- Existing functionality remains intact.
- Code is modular and readable.
- The project is ready for the next milestone.
