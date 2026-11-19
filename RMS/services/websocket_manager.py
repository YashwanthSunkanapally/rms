"""
RESTO DADDY - WebSocket Real-Time Broadcast Service
Synchronizes POS, KDS, Waiter App, Customer QR Menu, and Admin Suite instantly.
"""

from fastapi import WebSocket
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger("resto_daddy.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Any):
        """Broadcast an event payload to all connected clients."""
        if not self.active_connections:
            return
            
        payload = json.dumps({"event": event_type, "data": data})
        stale_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to websocket client: {e}")
                stale_connections.append(connection)

        for stale in stale_connections:
            if stale in self.active_connections:
                self.active_connections.remove(stale)

ws_manager = ConnectionManager()
