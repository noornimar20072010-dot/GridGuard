#!/usr/bin/env python
"""Test script for POST /alerts/{transformer_id}/evaluate endpoint.

This script:
1. Creates a test transformer with test telemetry data
2. Shows how to call the endpoint with proper authentication
"""

import json
import uuid
from datetime import datetime, timedelta

import jwt
from sqlalchemy.orm import Session

from database.session import SessionLocal, engine
from models import alert, telemetry, transformer, user
from models.telemetry import Telemetry
from models.transformer import Transformer
from utils.config import SUPABASE_JWT_SECRET

# Test data
TEST_TRANSFORMER_ID = "TEST-T-001"
TEST_ZONE = "ZONE-A"


def create_test_jwt() -> str:
    """Create a test JWT token for authentication.

    Note: This is for local testing only. In production, tokens come from Supabase Auth.
    """
    secret = SUPABASE_JWT_SECRET or "dev-jwt-secret-for-local-testing-only"
    if not SUPABASE_JWT_SECRET:
        print("WARNING: SUPABASE_JWT_SECRET not in .env, using dev secret for local testing")
        print("In production, add SUPABASE_JWT_SECRET from Supabase Dashboard > Project Settings > API\n")

    payload = {
        "sub": "test-user-123",
        "email": "test@gridguard.local",
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


def setup_test_data(db: Session):
    """Create test transformer and telemetry."""

    # Check if transformer already exists
    existing = db.query(Transformer).filter(Transformer.id == TEST_TRANSFORMER_ID).first()
    if existing:
        print(f"[OK] Test transformer {TEST_TRANSFORMER_ID} already exists")
        transformer = existing
    else:
        # Create test transformer
        transformer = Transformer(
            id=TEST_TRANSFORMER_ID,
            zone=TEST_ZONE,
        )
        db.add(transformer)
        db.commit()
        db.refresh(transformer)
        print(f"[OK] Created test transformer: {TEST_TRANSFORMER_ID}")

    # Check if telemetry already exists
    existing_telemetry = db.query(Telemetry).filter(Telemetry.transformer_id == TEST_TRANSFORMER_ID).first()
    if existing_telemetry:
        print(f"[OK] Telemetry for {TEST_TRANSFORMER_ID} already exists")
        return transformer

    # Create 24 hours of test telemetry (required by predictor)
    now = datetime.utcnow()
    for i in range(24):
        timestamp = now - timedelta(hours=24-i)
        # Simulate realistic load pattern (increasing trend to trigger alert)
        base_load = 600.0 + (i * 10)
        telemetry = Telemetry(
            transformer_id=TEST_TRANSFORMER_ID,
            recorded_at=timestamp,
            load=base_load,
            voltage=11.0,
            current=base_load / 11.0,
            temperature=40.0 + (i * 0.5),
        )
        db.add(telemetry)

    db.commit()
    print(f"[OK] Created 24 hours of test telemetry data")

    return transformer


def print_test_instructions(token: str):
    """Print curl and Python commands to test the endpoint."""

    print("\n" + "="*70)
    print("TEST INSTRUCTIONS")
    print("="*70)

    print("\n1. START THE BACKEND SERVER (if not running):")
    print("   cd backend")
    print("   uvicorn main:app --reload")

    print("\n2. TEST WITH CURL:")
    print(f"""
   curl -X POST "http://localhost:8000/alerts/{TEST_TRANSFORMER_ID}/evaluate" \\
     -H "Authorization: Bearer {token}" \\
     -H "Content-Type: application/json"
    """)

    print("\n3. OR TEST WITH PYTHON (requests library):")
    print(f"""
import requests

url = "http://localhost:8000/alerts/{TEST_TRANSFORMER_ID}/evaluate"
headers = {{"Authorization": "Bearer {token}"}}

response = requests.post(url, headers=headers)
print(response.json())
    """)

    print("\n4. EXPECTED RESPONSE:")
    print("""
{{
    "transformer_id": "TEST-T-001",
    "forecast": {{
        "current_load": 840.0,
        "predicted_load": 850.5,
        "health_status": "CRITICAL",
        "method": "linear_regression"
    }},
    "alert_created": true,
    "alert": {{
        "id": 1,
        "alert_type": "OVERLOAD_PREDICTED",
        "reason": "Predicted load 850.5 exceeds safe limit 800.0",
        "created_at": "2026-07-29T..."
    }}
}}
    """)

    print("\n5. TO CHECK ACTIVE ALERTS:")
    print(f"""
   curl -X GET "http://localhost:8000/alerts/active" \\
     -H "Authorization: Bearer {token}" \\
     -H "Content-Type: application/json"
    """)

    print("\n" + "="*70)
    print("Bearer Token for Testing (valid for 1 hour):")
    print("="*70)
    print(token)
    print("="*70 + "\n")


def main():
    """Setup test data and print instructions."""

    db = SessionLocal()
    try:
        print("Setting up test data...\n")
        setup_test_data(db)

        print("\nGenerating test JWT token...\n")
        token = create_test_jwt()

        print_test_instructions(token)

    finally:
        db.close()


if __name__ == "__main__":
    main()
