from fastapi import FastAPI

from api.routes.alerts import router as alerts_router
from api.routes.transformers import router as transformers_router
from models import alert, telemetry, transformer, user

app = FastAPI(title="GridGuard API")

app.include_router(transformers_router)
app.include_router(alerts_router)
