# SPEC.md

# GridGuard - Product Specification

## Project Name

**GridGuard**

## One-Line Description

GridGuard is a web-based predictive grid monitoring platform that helps Electricity Distribution Companies (DISCOMs) forecast transformer overloads using simulated telemetry, allowing operators to identify risks before failures occur.

GridGuard is a decision-support platform. It complements existing monitoring systems and does not replace SCADA.

---

# Problem Statement

Modern electrical utilities rely on SCADA systems to monitor transformers and other grid equipment.

Most monitoring systems are reactive. They alert operators only after measurements exceed safe operating thresholds, leaving little time to prevent failures.

This can result in:

- Transformer overloads
- Equipment damage
- Unexpected power outages
- Increased maintenance costs
- Reduced grid reliability

GridGuard demonstrates how predictive monitoring can improve operational awareness by forecasting overload conditions before they become critical.

---

# Project Goal

Develop a clean, modular, and maintainable web application that demonstrates predictive transformer monitoring using simulated telemetry.

The application should emphasize:

- Live monitoring
- Predictive analysis
- Early warning alerts
- Clear operator workflows
- Professional software engineering practices

The project should be achievable within a hackathon timeline while remaining easy to extend in the future.

---

# Core User Flow

```
Operator Login
        ↓
Dashboard
        ↓
Grid Tree
        ↓
Select Transformer
        ↓
View Live Telemetry + Historical Trend
        ↓
Prediction Engine
        ↓
Potential Overload Detected
        ↓
Alert Generated + AI Summary
        ↓
Operator Reviews Transformer
        ↓
Preventive Action Recommended
```

---

# Technology Stack

## Frontend

- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## Backend

- FastAPI (Python)

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

## AI

- Claude API (operator summaries and incident reports only — not used for prediction)

## Deployment

- Frontend: Vercel
- Backend: Railway
- Database: Supabase

---

# MVP Features

## Authentication

Operators should be able to:

- Log in securely
- Access protected dashboard pages
- Log out

Authentication should use Supabase Auth.

---

## Dashboard

The dashboard is the primary workspace.

It should display:

- System summary
- Active alerts
- Transformer overview
- Recent telemetry
- Prediction status

The dashboard should provide quick access to all monitored transformers.

---

## Grid Tree

The electrical network should be represented using a simple hierarchical tree instead of a geographic map.

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

Selecting a transformer should display its details and current telemetry.

---

## Transformer Details

Each transformer should display:

- Transformer ID
- Current Load
- Predicted Load
- Voltage
- Current
- Temperature
- Health Status
- Last Updated

The page or drawer should update automatically as new telemetry is received.

---

## Historical Load Trend Chart

Each transformer's detail view should include a simple line chart (Recharts) showing recent load history alongside the predicted trend line.

This gives operators visual context for *why* a prediction was made, not just the raw predicted number.

Kept intentionally simple: one chart, one transformer at a time. Multi-transformer comparison charts and exportable reports remain a Future Enhancement.

---

## Telemetry Generator

The application should generate realistic simulated transformer data.

Telemetry should include:

- Load
- Voltage
- Current
- Temperature

The simulator acts as the project's data source.

No real SCADA integration is required.

---

## Prediction Engine

The prediction engine should estimate future transformer load using deterministic mathematical forecasting.

It should:

- Predict future load
- Estimate overload risk
- Trigger alerts before safe operating limits are exceeded

Predictions should remain lightweight, explainable, and deterministic.

Machine learning is outside the scope of the MVP.

---

## Alert System

Generate alerts when:

- Predicted load exceeds safe limits
- Transformer temperature becomes critical
- Transformer health becomes critical

Alerts should be visible directly from the dashboard.

---

## AI-Generated Operator Summary

When a critical alert is triggered, the backend should call the Claude API to generate a short, plain-English summary of the situation (what's happening, and the recommended preventive action) based on the transformer's current and predicted telemetry.

Claude is used only to explain a decision the prediction engine already made — it does not decide whether an overload is occurring. This keeps the prediction logic deterministic and explainable while still giving operators a fast, human-readable report.

---

# Database

Implement the database incrementally.

## Phase 1

- User
- Transformer
- Telemetry

## Phase 2

- Alert

Additional models should only be introduced when required by future milestones.

---

# User Interface

The application should resemble a modern utility operations dashboard.

Primary layout:

- Sidebar
- Top Navigation
- Summary Cards
- Alert Panel
- Grid Tree
- Transformer Table
- Transformer Details (including trend chart and AI summary)

The interface should prioritize clarity, responsiveness, and ease of navigation.

Support desktop and tablet layouts.

---

# Non-Goals

The MVP does not include:

- Google Maps
- Geographic visualization
- Real SCADA integration
- Machine learning
- Automatic transformer control
- Advanced analytics
- Multi-transformer comparison reporting
- Exportable/downloadable reports
- Role-based permissions
- Multi-organization support

These features are intentionally excluded to keep the MVP focused and achievable.

---

# Future Enhancements

Possible future improvements include:

- Multi-transformer comparison charts
- Trend analysis across zones
- Exportable PDF reports
- Maintenance scheduling
- Asset management
- Role-based access control
- Multi-organization support
- Cloud monitoring
- Mobile-friendly interface
- Real historical dataset + ML-based forecasting (as a research extension beyond the deterministic MVP engine)

These features are outside the current project scope.

---

# Definition of Done

GridGuard is considered complete when:

- Operators can authenticate successfully.
- The dashboard displays live simulated telemetry.
- The telemetry generator updates transformer readings automatically.
- The Grid Tree allows navigation between zones and transformers.
- Transformer overloads are predicted before safe operating limits are exceeded.
- Alerts notify operators before critical conditions occur.
- A critical alert includes an AI-generated plain-English summary.
- Transformer Details display current telemetry, a historical load trend chart, and prediction status.
- The interface is responsive and easy to navigate.
- The application is successfully deployed.
- The demo runs reliably in under three minutes.
- The source code is modular, documented, and maintainable.

---

# Success Criteria

A successful implementation should demonstrate:

- Clean architecture
- Modular code organization
- Reliable telemetry simulation
- Predictive monitoring workflow
- AI-assisted operator communication (without AI making the underlying decision)
- Visual, chart-based context for predictions
- Responsive user interface
- Stable end-to-end functionality

The priority is delivering a polished, maintainable MVP rather than implementing unnecessary features.
