#!/usr/bin/env python
"""Seed mock transformers into the database.

This script inserts the standard test transformers with simulated telemetry.
"""

from datetime import datetime, timedelta, timezone

from database.session import SessionLocal
from models import alert, telemetry, transformer, user
from models.transformer import Transformer
from models.telemetry import Telemetry

TRANSFORMERS = {
    "T-101": {"zone": "Zone A", "current_load": 62.0},
    "T-102": {"zone": "Zone A", "current_load": 58.0},
    "T-104": {"zone": "Zone A", "current_load": 89.0},
    "T-201": {"zone": "Zone B", "current_load": 44.0},
    "T-202": {"zone": "Zone B", "current_load": 81.0},
    "T-301": {"zone": "Zone C", "current_load": 35.0},
    "T-302": {"zone": "Zone C", "current_load": 41.0},
    "T-305": {"zone": "Zone C", "current_load": 55.0},
}

db = SessionLocal()

try:
    print("Seeding transformers into database...\n")

    for transformer_id, data in TRANSFORMERS.items():
        # Check if already exists
        existing = db.query(Transformer).filter(Transformer.id == transformer_id).first()
        if existing:
            print(f"[SKIP] {transformer_id} already exists")
            continue

        # Create transformer
        transformer = Transformer(
            id=transformer_id,
            zone=data["zone"],
        )
        db.add(transformer)
        db.commit()
        db.refresh(transformer)
        print(f"[OK] Created {transformer_id} ({data['zone']})")

        # Create 24 hours of simulated telemetry
        now = datetime.now(timezone.utc)
        base_load = data["current_load"]

        for i in range(24):
            # Create realistic load pattern with slight variation
            hours_ago = 24 - i
            load = base_load + (i * 0.5)  # Slight upward trend
            voltage = 230.0 - (load * 0.1)
            current = load * 1.8
            temperature = 40.0 + (load * 0.3)

            telemetry = Telemetry(
                transformer_id=transformer_id,
                recorded_at=now - timedelta(hours=hours_ago),
                load=load,
                voltage=voltage,
                current=current,
                temperature=temperature,
            )
            db.add(telemetry)

        db.commit()
        print(f"    [+] Added 24 hours of telemetry")

    print("\n[OK] Seeding complete")

finally:
    db.close()
