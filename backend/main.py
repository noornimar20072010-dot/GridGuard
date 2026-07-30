import asyncio
import logging

from fastapi import FastAPI

from api.routes.alerts import router as alerts_router
from api.routes.transformers import router as transformers_router
from services.generator import TelemetryGenerator

logger = logging.getLogger(__name__)

app = FastAPI(title="GridGuard API")

app.include_router(transformers_router)
app.include_router(alerts_router)


@app.on_event("startup")
async def start_telemetry_generator():
    """Start the telemetry generator in the background on server startup."""
    try:
        generator = TelemetryGenerator()
        asyncio.create_task(generator.run(interval_seconds=5.0))
        logger.info("Telemetry generator started in background")
    except Exception as e:
        logger.error(f"Failed to start telemetry generator: {e}")
