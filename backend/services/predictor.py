"""Deterministic load forecasting for GridGuard transformers.

Forecasts a transformer's near-future load from its recent Telemetry
history using linear regression (trend + extrapolation), falling back to
a simple moving average when there isn't enough history for a reliable
trend. No machine learning, per SPEC.md's Non-Goals — the engine is plain
arithmetic and fully explainable.

This module must remain deterministic and must not call the Claude API.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from models.telemetry import Telemetry

DEFAULT_HISTORY_LIMIT = 20
MIN_POINTS_FOR_REGRESSION = 3
DEFAULT_FORECAST_HORIZON_SECONDS = 300  # 5 minutes ahead
MOVING_AVERAGE_WINDOW = 5

# Load thresholds, as a percentage of rated capacity. Crossing WARNING means
# the transformer is approaching its safe operating limit; crossing CRITICAL
# means it already is, or is forecast to be, overloaded.
WARNING_LOAD_THRESHOLD = 90.0
CRITICAL_LOAD_THRESHOLD = 100.0

HEALTHY = "healthy"
WARNING = "warning"
CRITICAL = "critical"


@dataclass
class LoadForecast:
    transformer_id: str
    current_load: float
    predicted_load: float
    method: str  # "linear_regression" or "moving_average"
    horizon_seconds: int
    health_status: str  # "healthy", "warning", or "critical"


def compute_health_status(current_load: float, predicted_load: float) -> str:
    """Classify health from current + predicted load against fixed thresholds.

    Either reading alone can trigger warning/critical — a transformer that's
    fine right now but forecast to cross a threshold should still be flagged,
    since the whole point of forecasting is to warn before it happens.
    """
    worst_load = max(current_load, predicted_load)

    if worst_load >= CRITICAL_LOAD_THRESHOLD:
        return CRITICAL
    if worst_load >= WARNING_LOAD_THRESHOLD:
        return WARNING
    return HEALTHY


def get_recent_telemetry(db: Session, transformer_id: str, limit: int = DEFAULT_HISTORY_LIMIT):
    """Fetch a transformer's recent telemetry, oldest first."""
    rows = (
        db.query(Telemetry)
        .filter(Telemetry.transformer_id == transformer_id)
        .order_by(Telemetry.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))


def _moving_average(loads):
    window = loads[-MOVING_AVERAGE_WINDOW:]
    return sum(window) / len(window)


def _linear_regression_forecast(points, horizon_seconds):
    """Least-squares fit of load vs. elapsed seconds, extrapolated forward."""
    t0 = points[0][0]
    xs = [(t - t0).total_seconds() for t, _ in points]
    ys = [load for _, load in points]

    n = len(xs)
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    denominator = sum((x - mean_x) ** 2 for x in xs)

    if denominator == 0:
        return ys[-1]

    slope = numerator / denominator
    intercept = mean_y - slope * mean_x

    forecast_x = xs[-1] + horizon_seconds
    return slope * forecast_x + intercept


def forecast_load(
    telemetry_history,
    horizon_seconds: int = DEFAULT_FORECAST_HORIZON_SECONDS,
) -> LoadForecast:
    """Predict a transformer's load `horizon_seconds` past its last reading.

    `telemetry_history` must be ordered oldest-first (see
    `get_recent_telemetry`) and contain at least one reading. Uses linear
    regression when there's enough history for a meaningful trend line,
    otherwise falls back to a moving average of recent readings.
    """
    if not telemetry_history:
        raise ValueError("telemetry_history must contain at least one reading")

    transformer_id = telemetry_history[-1].transformer_id
    current_load = telemetry_history[-1].load
    loads = [row.load for row in telemetry_history]

    if len(telemetry_history) >= MIN_POINTS_FOR_REGRESSION:
        points = [(row.recorded_at, row.load) for row in telemetry_history]
        predicted_load = _linear_regression_forecast(points, horizon_seconds)
        method = "linear_regression"
    else:
        predicted_load = _moving_average(loads)
        method = "moving_average"

    predicted_load = max(predicted_load, 0.0)

    return LoadForecast(
        transformer_id=transformer_id,
        current_load=current_load,
        predicted_load=round(predicted_load, 2),
        method=method,
        horizon_seconds=horizon_seconds,
        health_status=compute_health_status(current_load, predicted_load),
    )
