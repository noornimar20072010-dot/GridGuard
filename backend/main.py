from fastapi import FastAPI

from api.routes.transformers import router as transformers_router

app = FastAPI(title="GridGuard API")

app.include_router(transformers_router)
