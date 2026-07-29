"""Small standalone check for services/predictor.py.

Feeds a steadily rising load trend into forecast_load() and confirms the
linear-regression forecast catches an approaching threshold crossing before
the current reading alone would. Run directly with:

    python backend/tests/test_predictor.py
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from services.predictor import (  # noqa: E402
    CRITICAL,
    HEALTHY,
    WARNING_LOAD_THRESHOLD,
    compute_health_status,
    forecast_load,
)


def make_reading(transformer_id, load, minutes_ago):
    return SimpleNamespace(
        transformer_id=transformer_id,
        load=load,
        recorded_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
    )


def test_rising_trend_predicts_approaching_crossing():
    # Load climbs 5% every minute for 6 minutes: 60 -> 85, all still healthy
    # on their own, but the trend is heading straight for an overload.
    loads = [60, 65, 70, 75, 80, 85]
    history = [
        make_reading("T-101", load, minutes_ago=len(loads) - 1 - i)
        for i, load in enumerate(loads)
    ]

    forecast = forecast_load(history, horizon_seconds=300)  # 5 minutes ahead

    assert forecast.method == "linear_regression", f"expected linear_regression, got {forecast.method}"
    assert forecast.current_load == 85, f"expected current_load 85, got {forecast.current_load}"
    assert forecast.current_load < WARNING_LOAD_THRESHOLD, "current load should still read healthy on its own"
    assert forecast.predicted_load > forecast.current_load, "predicted load should continue the upward trend"
    assert forecast.predicted_load >= 100, f"expected predicted load to cross 100%, got {forecast.predicted_load}"
    assert forecast.health_status == CRITICAL, f"expected CRITICAL from the forecast, got {forecast.health_status}"

    # The whole point of forecasting: current reading alone says healthy.
    current_only_status = compute_health_status(forecast.current_load, forecast.current_load)
    assert current_only_status == HEALTHY, "current-only status should be healthy, showing the forecast caught it early"

    print(
        f"PASS: rising trend -> current={forecast.current_load}%, "
        f"predicted={forecast.predicted_load}% in {forecast.horizon_seconds}s -> {forecast.health_status}"
    )


def test_flat_trend_stays_healthy():
    # Sanity check: a stable load well under threshold should not falsely
    # trigger a warning/critical just from noise in the regression.
    history = [make_reading("T-102", 40, minutes_ago=m) for m in reversed(range(6))]

    forecast = forecast_load(history, horizon_seconds=300)

    assert forecast.health_status == HEALTHY, f"expected HEALTHY for a flat trend, got {forecast.health_status}"
    print(f"PASS: flat trend -> current={forecast.current_load}%, predicted={forecast.predicted_load}% -> {forecast.health_status}")


if __name__ == "__main__":
    test_rising_trend_predicts_approaching_crossing()
    test_flat_trend_stays_healthy()
    print("All predictor tests passed.")
