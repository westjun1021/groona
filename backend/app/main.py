
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .db import init_db
from .routers.api import router as api_router
from .routers.web import router as web_router
from .services.sync import sync_all
BASE=Path(__file__).resolve().parents[2]
app=FastAPI(title="GROONA 4.0",version="4.0.0")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
app.mount("/static",StaticFiles(directory=str(BASE/"apps"/"web"/"static")),name="static")
app.include_router(api_router)
app.include_router(web_router)
@app.on_event("startup")
async def startup():init_db();await sync_all()
@app.post("/admin/sync")
async def sync():return {"result":await sync_all()}
