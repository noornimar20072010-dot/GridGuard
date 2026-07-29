#!/usr/bin/env python
"""Comprehensive test for AI summary endpoint with all scenarios."""

from datetime import datetime, timedelta

import jwt
import requests

from utils.config import SUPABASE_JWT_SECRET

BASE_URL = "http://localhost:8000"


def create_token() -> str:
    secret = SUPABASE_JWT_SECRET or "dev-jwt-secret-for-local-testing-only"
    payload = {
        "sub": "test-user",
        "email": "test@gridguard.local",
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def test_scenarios():
    token = create_token()
    headers = {"Authorization": f"Bearer {token}"}

    print("="*70)
    print("AI SUMMARY ENDPOINT - COMPREHENSIVE TEST")
    print("="*70)

    # Scenario 1: Get summary for a critical alert (should work)
    print("\n[SCENARIO 1] Get AI summary for critical alert (Alert #1)")
    print("-" * 70)
    try:
        response = requests.post(
            f"{BASE_URL}/alerts/1/ai-summary",
            headers=headers,
            timeout=30,
        )
        if response.status_code == 200:
            result = response.json()
            print(f"[PASS] Status: 200")
            print(f"       Transformer: {result['transformer_id']}")
            print(f"       Summary: {result['summary'][:80]}...")
        else:
            print(f"[FAIL] Status: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Scenario 2: Try to get summary for non-existent alert (should fail)
    print("\n[SCENARIO 2] Get AI summary for non-existent alert (Alert #999)")
    print("-" * 70)
    try:
        response = requests.post(
            f"{BASE_URL}/alerts/999/ai-summary",
            headers=headers,
            timeout=5,
        )
        if response.status_code == 404:
            print(f"[PASS] Status: 404 (correctly rejected non-existent alert)")
            print(f"       Message: {response.json()['detail']}")
        else:
            print(f"[FAIL] Expected 404, got {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Scenario 3: Check that endpoint requires authentication
    print("\n[SCENARIO 3] Test authentication requirement (no Bearer token)")
    print("-" * 70)
    try:
        response = requests.post(
            f"{BASE_URL}/alerts/1/ai-summary",
            timeout=5,
        )
        if response.status_code == 401:
            print(f"[PASS] Status: 401 (authentication required)")
            print(f"       Message: {response.json()['detail']}")
        else:
            print(f"[FAIL] Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Scenario 4: List active alerts to see what we have
    print("\n[SCENARIO 4] List active alerts")
    print("-" * 70)
    try:
        response = requests.get(
            f"{BASE_URL}/alerts/active",
            headers=headers,
            timeout=5,
        )
        if response.status_code == 200:
            result = response.json()
            print(f"[INFO] Found {result['count']} active alerts:")
            for alert in result['alerts']:
                print(f"       - Alert #{alert['id']}: {alert['transformer_id']} ({alert['alert_type']}, {alert['health_status']})")
        else:
            print(f"[FAIL] Status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] {e}")

    print("\n" + "="*70)
    print("TESTS COMPLETE")
    print("="*70)
    print("\n[INFO] To use the real Claude API, set CLAUDE_API_KEY in .env:")
    print("       export CLAUDE_API_KEY=sk-...")
    print("       Then restart the backend and the AI summaries will use the real API")


if __name__ == "__main__":
    print("\nMake sure the backend server is running:")
    print("  cd backend && uvicorn main:app --reload\n")
    input("Press Enter when the backend is ready...")
    test_scenarios()
