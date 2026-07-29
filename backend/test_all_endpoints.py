#!/usr/bin/env python
"""Test all transformer and alert endpoints to verify single source of truth."""

import json
from datetime import datetime, timedelta

import jwt
import requests

from utils.config import SUPABASE_JWT_SECRET

BASE_URL = "http://localhost:8000"

# Create a test JWT token
def create_token() -> str:
    secret = SUPABASE_JWT_SECRET or "dev-jwt-secret-for-local-testing-only"
    payload = {
        "sub": "test-user",
        "email": "test@gridguard.local",
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def test_endpoints():
    token = create_token()
    headers = {"Authorization": f"Bearer {token}"}

    print("="*70)
    print("ENDPOINT VERIFICATION")
    print("="*70)

    # Test 1: GET /transformers
    print("\n1. GET /transformers")
    print("-" * 70)
    try:
        response = requests.get(f"{BASE_URL}/transformers", headers=headers, timeout=5)
        if response.status_code == 200:
            transformers = response.json()
            print(f"[OK] Status: 200")
            print(f"[OK] Found {len(transformers)} transformers:")
            for t in transformers:
                print(f"     - {t['id']} ({t['zone']})")

            # Check if TEST-T-001 is included
            test_t_001_found = any(t['id'] == 'TEST-T-001' for t in transformers)
            if test_t_001_found:
                print("[OK] TEST-T-001 is included in the list")
            else:
                print("[FAIL] TEST-T-001 is NOT in the list")
        else:
            print(f"[FAIL] Status: {response.status_code}")
            print(f"       {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Test 2: GET /transformers/TEST-T-001
    print("\n2. GET /transformers/TEST-T-001")
    print("-" * 70)
    try:
        response = requests.get(f"{BASE_URL}/transformers/TEST-T-001", headers=headers, timeout=5)
        if response.status_code == 200:
            transformer = response.json()
            print(f"[OK] Status: 200")
            print(f"[OK] Found transformer:")
            print(f"     ID: {transformer['id']}")
            print(f"     Zone: {transformer['zone']}")
            print(f"     Current Load: {transformer['current_load']}")
            print(f"     Temperature: {transformer['temperature']}")
        else:
            print(f"[FAIL] Status: {response.status_code}")
            print(f"       {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Test 3: POST /alerts/TEST-T-001/evaluate
    print("\n3. POST /alerts/TEST-T-001/evaluate")
    print("-" * 70)
    try:
        response = requests.post(
            f"{BASE_URL}/alerts/TEST-T-001/evaluate",
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Status: 200")
            print(f"[OK] Evaluation result:")
            print(f"     Transformer ID: {result['transformer_id']}")
            print(f"     Current Load: {result['forecast']['current_load']}")
            print(f"     Predicted Load: {result['forecast']['predicted_load']}")
            print(f"     Health Status: {result['forecast']['health_status']}")
            print(f"     Method: {result['forecast']['method']}")

            if result['alert_created']:
                print(f"\n[OK] ALERT CREATED:")
                print(f"     ID: {result['alert']['id']}")
                print(f"     Type: {result['alert']['alert_type']}")
                print(f"     Reason: {result['alert']['reason']}")
                print(f"     Created: {result['alert']['created_at']}")
            else:
                print(f"\n[INFO] No alert was created (load within safe limits)")
        else:
            print(f"[FAIL] Status: {response.status_code}")
            print(f"       {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    # Test 4: GET /alerts/active
    print("\n4. GET /alerts/active")
    print("-" * 70)
    try:
        response = requests.get(f"{BASE_URL}/alerts/active", headers=headers, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] Status: 200")
            print(f"[OK] Active alerts: {result['count']}")
            for alert in result['alerts']:
                print(f"     - Alert #{alert['id']}: {alert['transformer_id']} ({alert['alert_type']})")
        else:
            print(f"[FAIL] Status: {response.status_code}")
            print(f"       {response.text}")
    except Exception as e:
        print(f"[ERROR] {e}")

    print("\n" + "="*70)
    print("VERIFICATION COMPLETE")
    print("="*70)


if __name__ == "__main__":
    print("\nMake sure the backend server is running:")
    print("  cd backend && uvicorn main:app --reload\n")
    input("Press Enter when the backend is ready...")
    test_endpoints()
