#!/usr/bin/env python
"""Initialize database schema.

Creates all tables defined in models/ using SQLAlchemy's metadata.
Run this once to set up the database.
"""

import sys

from database.base import Base
from database.session import engine
from models import alert, telemetry, transformer, user
from utils.config import DATABASE_URL


def migrate():
    """Create all tables."""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not configured")
        sys.exit(1)

    if not engine:
        print("ERROR: Database engine not initialized")
        sys.exit(1)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully")


if __name__ == "__main__":
    migrate()
