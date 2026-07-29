from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from utils.config import DATABASE_URL

# Engine creation is deferred until DATABASE_URL is configured so importing
# this module (e.g. for routes that don't touch the DB yet) never fails.
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session.

    TODO(Milestone 4+): wire this into routes once generator.py/predictor.py
    persist real telemetry — today's transformer routes use mock data and do
    not depend on this.
    """
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
