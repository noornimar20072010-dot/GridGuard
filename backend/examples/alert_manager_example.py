"""Example: Using alert_manager.py with mock LoadForecast data.

This demonstrates how alert_manager.py evaluates predictions and creates alerts,
with realistic mock data matching predictor.py's LoadForecast output shape.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

# Mock data structure matching predictor.LoadForecast
@dataclass
class MockLoadForecast:
    transformer_id: str
    current_load: float
    predicted_load: float
    method: str
    horizon_seconds: int
    health_status: str


# Example forecasts for different scenarios
EXAMPLE_FORECASTS = [
    # Healthy transformer
    MockLoadForecast(
        transformer_id="T-101",
        current_load=45.0,
        predicted_load=48.0,
        method="linear_regression",
        horizon_seconds=300,
        health_status="healthy",
    ),
    # Warning threshold
    MockLoadForecast(
        transformer_id="T-102",
        current_load=88.0,
        predicted_load=92.0,
        method="linear_regression",
        horizon_seconds=300,
        health_status="warning",
    ),
    # Critical threshold
    MockLoadForecast(
        transformer_id="T-201",
        current_load=98.0,
        predicted_load=105.0,
        method="linear_regression",
        horizon_seconds=300,
        health_status="critical",
    ),
]


def test_alert_evaluation_logic():
    """Test the core alert evaluation logic."""
    from services.alert_manager import (
        check_active_alert_exists,
        get_alert_reason,
    )

    print("=" * 60)
    print("Testing Alert Evaluation Logic (without database)")
    print("=" * 60)

    for forecast in EXAMPLE_FORECASTS:
        print(f"\n[{forecast.transformer_id}]")
        print(f"  Current Load: {forecast.current_load}%")
        print(f"  Predicted Load: {forecast.predicted_load}%")
        print(f"  Health Status: {forecast.health_status}")

        if forecast.health_status != "healthy":
            reason = get_alert_reason(forecast)
            print(f"  Alert Reason: {reason}")
        else:
            print("  → No alert (healthy)")


if __name__ == "__main__":
    test_alert_evaluation_logic()
