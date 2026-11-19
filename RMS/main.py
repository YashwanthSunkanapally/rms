"""
RESTO DADDY - Premium Restaurant Management & POS Ecosystem
FastAPI Full-Stack Server with WebSocket Real-Time Synchronization
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import logging

from database import init_db, query_one
from seed_data import populate_seed_data
from services.websocket_manager import ws_manager

# Routers
from routers.dashboard import router as dashboard_router
from routers.orders import router as orders_router
from routers.tables import router as tables_router
from routers.menu import router as menu_router
from routers.kds import router as kds_router
from routers.inventory import router as inventory_router
from routers.staff import router as staff_router
from routers.customers import router as customers_router
from routers.billing import router as billing_router
from routers.reports import router as reports_router
from routers.settings import router as settings_router
from routers.cashier import router as cashier_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resto_daddy")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    count = query_one("SELECT COUNT(*) as c FROM menu_items")
    if not count or count["c"] == 0:
        logger.info("Database is empty, generating realistic seed data...")
        populate_seed_data()
    logger.info("RESTO DADDY ecosystem initialized successfully!")
    yield

app = FastAPI(
    title="SPICEHOLLIC API",
    description="Spicehollic - Premium Restaurant Management & POS Ecosystem (FastAPI + WebSocket + SQLite)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(dashboard_router)
app.include_router(orders_router)
app.include_router(tables_router)
app.include_router(menu_router)
app.include_router(kds_router)
app.include_router(inventory_router)
app.include_router(staff_router)
app.include_router(customers_router)
app.include_router(billing_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(cashier_router)

# Mount Static Files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# WebSocket endpoint for real-time synchronization across POS, KDS, Waiter, QR, Admin
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client heartbeat or echo
            await websocket.send_text(f'{{"event": "pong", "data": "{data}"}}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

# HTML View Routes
@app.get("/", response_class=HTMLResponse)
def index_page():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>RESTO DADDY is loading...</h1>")

@app.get("/pos", response_class=HTMLResponse)
def pos_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/kds", response_class=HTMLResponse)
def kds_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/waiter", response_class=HTMLResponse)
def waiter_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/qr", response_class=HTMLResponse)
def qr_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/inventory", response_class=HTMLResponse)
def inventory_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/cashier", response_class=HTMLResponse)
def cashier_page():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Spicehollic", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
