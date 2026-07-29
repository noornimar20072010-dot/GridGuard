#!/usr/bin/env python
"""Test the AI summary endpoint."""

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


def test_ai_summary():
    token = create_token()
    headers = {"Authorization": f"Bearer {token}"}

    print("="*70)
    print("AI SUMMARY ENDPOINT TEST")
    print("="*70)

    # Test with Alert #1 (the critical alert we know exists)
    alert_id = 1

    print(f"\nTesting: POST /alerts/{alert_id}/ai-summary")
    print("-" * 70)

    try:
        response = requests.post(
            f"{BASE_URL}/alerts/{alert_id}/ai-summary",
            headers=headers,
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Status: 200")
            print(f"\n[OK] AI Summary Generated:")
            print(f"     Alert ID: {result['alert_id']}")
            print(f"     Transformer: {result['transformer_id']}")
            print(f"     Health Status: {result['health_status']}")
            print(f"\n[SUMMARY]")
            print(f"     {result['summary']}")
        else:
            print(f"[FAIL] Status: {response.status_code}")
            print(f"       {response.text}")

    except requests.exceptions.Timeout:
        print("[WARN] Request timed out (Claude API may be slow)")
    except Exception as e:
        print(f"[ERROR] {e}")

    print("\n" + "="*70)


if __name__ == "__main__":
    print("\nMake sure the backend server is running:")
    print("  cd backend && uvicorn main:app --reload\n")
    input("Press Enter when the backend is ready...")
    test_ai_summary()
