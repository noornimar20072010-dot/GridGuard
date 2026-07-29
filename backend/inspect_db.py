#!/usr/bin/env python
"""Inspect database tables to verify test data."""

from database.session import SessionLocal
from models import alert, telemetry, transformer, user
from models.transformer import Transformer
from models.telemetry import Telemetry
from models.alert import Alert

db = SessionLocal()

try:
    print("="*70)
    print("DATABASE INSPECTION")
    print("="*70)

    # Check transformers table
    print("\n1. TRANSFORMERS TABLE:")
    print("-" * 70)
    transformers = db.query(Transformer).all()
    if not transformers:
        print("   [EMPTY] No transformers in database")
    else:
        print(f"   Total: {len(transformers)} transformers")
        for t in transformers:
            print(f"   - {t.id} (Zone: {t.zone}, Created: {t.created_at})")

    # Check telemetry table
    print("\n2. TELEMETRY TABLE:")
    print("-" * 70)
    all_telemetry = db.query(Telemetry).all()
    if not all_telemetry:
        print("   [EMPTY] No telemetry records in database")
    else:
        print(f"   Total: {len(all_telemetry)} telemetry records")

        # Group by transformer_id
        by_transformer = {}
        for t in all_telemetry:
            if t.transformer_id not in by_transformer:
                by_transformer[t.transformer_id] = []
            by_transformer[t.transformer_id].append(t)

        for tid, records in sorted(by_transformer.items()):
            print(f"   - {tid}: {len(records)} records")
            if records:
                oldest = min(records, key=lambda r: r.recorded_at)
                newest = max(records, key=lambda r: r.recorded_at)
                print(f"     Time range: {oldest.recorded_at} to {newest.recorded_at}")

    # Check alerts table
    print("\n3. ALERTS TABLE:")
    print("-" * 70)
    all_alerts = db.query(Alert).all()
    if not all_alerts:
        print("   [EMPTY] No alerts in database")
    else:
        print(f"   Total: {len(all_alerts)} alerts")
        for a in all_alerts:
            print(f"   - Alert #{a.id}: {a.transformer_id} ({a.alert_type})")
            print(f"     Created: {a.created_at}, Resolved: {a.resolved_at}")

    # Specific check for TEST-T-001
    print("\n4. SPECIFIC CHECK: TEST-T-001")
    print("-" * 70)
    test_transformer = db.query(Transformer).filter(Transformer.id == "TEST-T-001").first()
    if test_transformer:
        print(f"   [FOUND] TEST-T-001 exists in transformers table")
        print(f"   Zone: {test_transformer.zone}")
        print(f"   Created: {test_transformer.created_at}")

        test_telemetry = db.query(Telemetry).filter(Telemetry.transformer_id == "TEST-T-001").all()
        print(f"\n   Telemetry records: {len(test_telemetry)}")
        if test_telemetry:
            for i, t in enumerate(test_telemetry[:3]):
                print(f"   - Record {i+1}: {t.load} load @ {t.recorded_at}")
            if len(test_telemetry) > 3:
                print(f"   ... and {len(test_telemetry) - 3} more records")
        else:
            print("   [WARNING] No telemetry records for TEST-T-001!")
    else:
        print(f"   [NOT FOUND] TEST-T-001 does not exist in transformers table")

    print("\n" + "="*70)

finally:
    db.close()
