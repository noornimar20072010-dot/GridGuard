# Alert System Architecture

## Overview

The alert system evaluates transformer health predictions and creates alert records in the database when transformers transition to `warning` or `critical` health status.

## Components

### 1. **Alert Model** (`models/alert.py`)

Stores alert data in the database:

```
alerts (table)
├── id (PK, auto-increment)
├── transformer_id (FK)
├── alert_type (e.g., "load_warning", "load_critical")
├── health_status ("warning" or "critical")
├── current_load (float, %)
├── predicted_load (float, %)
├── temperature (float, °C, nullable)
├── reason (plain-English explanation)
├── created_at (auto)
└── resolved_at (nullable, when dismissed)
```

### 2. **Alert Manager Service** (`services/alert_manager.py`)

Core business logic for evaluating predictions and managing alerts.

**Key Functions:**

- `evaluate_and_create_alert(db, forecast)` — Main entry point
  - Takes a `LoadForecast` from `predictor.py`
  - Returns created `Alert`, or `None` if no alert needed
  - Deduplicates: won't create duplicate alerts at the same status level

- `get_alert_reason(forecast)` — Generates plain-English alert message

- `check_active_alert_exists(db, transformer_id, health_status)` — Prevents duplicates

- `get_latest_temperature(db, transformer_id)` — Includes current temperature in alert

- `resolve_alert(db, alert_id)` — Mark alert as resolved

- `get_active_alerts(db, transformer_id=None)` — Fetch unresolved alerts

### 3. **Alert API Routes** (`api/routes/alerts.py`)

Exposes alert functionality via REST endpoints:

- **POST** `/alerts/{transformer_id}/evaluate`
  - Runs predictor on the transformer, evaluates, and creates alert if needed
  - Returns: forecast data + alert (if created)

- **GET** `/alerts/active`
  - Fetch all unresolved alerts
  - Returns: count + alert list

- **PATCH** `/alerts/{alert_id}/resolve`
  - Mark an alert as resolved
  - Returns: resolved_at timestamp

### 4. **Alert Schemas** (`schemas/alert.py`)

Pydantic model for API responses, with `from_attributes=True` for ORM mapping.

## Data Flow

```
Telemetry Generator
       ↓
  Telemetry Table
       ↓
  predictor.py (LoadForecast)
       ↓
  alert_manager.evaluate_and_create_alert()
       ↓
  Alert Table
       ↓
  API Routes (GET, PATCH)
       ↓
  Frontend (dashboard alerts, alert panel)
```

## Threshold Logic

Thresholds are defined in `predictor.py`:

- **WARNING**: Load ≥ 90%
- **CRITICAL**: Load ≥ 100%

`compute_health_status()` evaluates both **current** and **predicted** load—if either crosses a threshold, the transformer is flagged. This ensures warnings are raised *before* overload occurs.

## Alert Deduplication

To prevent spam, `evaluate_and_create_alert()` checks for existing unresolved alerts:

- If a `warning` alert already exists for transformer T, no new `warning` alert is created
- If status escalates from `warning` → `critical`, a new `critical` alert *is* created
- Once the transformer returns to `healthy`, old alerts remain (with `resolved_at = None`) until manually dismissed

## Example Usage

### With Mock Data

```python
from services.predictor import LoadForecast
from services.alert_manager import evaluate_and_create_alert

# Mock forecast
forecast = LoadForecast(
    transformer_id="T-201",
    current_load=98.0,
    predicted_load=105.0,
    method="linear_regression",
    horizon_seconds=300,
    health_status="critical",
)

# Evaluate and create alert
alert = evaluate_and_create_alert(db, forecast)
# Returns: Alert(id=1, transformer_id="T-201", alert_type="load_critical", ...)
```

### Integration with Predictor

```python
from services.predictor import forecast_load, get_recent_telemetry
from services.alert_manager import evaluate_and_create_alert

# Get telemetry
telemetry = get_recent_telemetry(db, "T-201")

# Forecast load
forecast = forecast_load(telemetry)

# Evaluate and create alert
alert = evaluate_and_create_alert(db, forecast)
if alert:
    print(f"Alert created: {alert.reason}")
```

## Testing Checklist

- [ ] Alert model creates correctly
- [ ] Deduplication prevents duplicate alerts
- [ ] Alert reason is generated correctly
- [ ] Temperature is captured from latest telemetry
- [ ] Health status transitions trigger new alerts
- [ ] `resolve_alert()` sets `resolved_at`
- [ ] API endpoints return correct response shapes
- [ ] Authentication works on all alert endpoints

## Future Enhancements

- Temperature-based alerts (critical temp thresholds)
- Alert history and trend analysis
- Configurable thresholds per transformer/zone
- AI-generated operator summaries (Claude API)
- Alert escalation (e.g., page oncall if critical)
- Bulk alert resolution
