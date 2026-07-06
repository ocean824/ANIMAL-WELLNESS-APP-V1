"""Soula Paws — AI Bond & Wellness OS. FastAPI application entrypoint.
Architecture: modular routers + services + MongoDB (Motor) persistence.
"""
import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import APIRouter, FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

from database import client, ensure_indexes, now_iso
from seed import seed_database
from routers import (account_routes, admin_routes, agent_routes, auth_routes, crud_routes,
                     voice_routes, workflow_routes)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("soula")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    await seed_database()
    logger.info("Soula Paws backend ready.")
    yield
    client.close()


app = FastAPI(title="Soula Paws — AI Bond & Wellness OS", lifespan=lifespan)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "soula-paws", "time": now_iso()}


# Request ID middleware (observability improvement carried over from source middleware stack)
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request.state.request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["x-request-id"] = request.state.request_id
    return response


# Order matters: specific routers first, generic CRUD catch-all last.
api_router.include_router(auth_routes.router)
api_router.include_router(workflow_routes.router)
api_router.include_router(agent_routes.router)
api_router.include_router(voice_routes.router)
api_router.include_router(admin_routes.router)
api_router.include_router(account_routes.router)
api_router.include_router(crud_routes.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
