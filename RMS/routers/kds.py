"""
RESTO DADDY - Kitchen Display System (KDS) Router
Live KOT ticket feed, preparation timer states, station filters, and chef actions.
"""

from fastapi import APIRouter
from database import query_all, query_one, execute_cmd
from services.websocket_manager import ws_manager
import datetime

router = APIRouter(prefix="/api/kds", tags=["KDS"])

@router.get("/tickets")
def get_kds_tickets(station: str = None):
    # Fetch active orders that belong in the kitchen workflow
    orders = query_all("""
        SELECT id, order_number, order_type, table_number, customer_name,
               waiter_name, status, special_instructions, created_at, updated_at
        FROM orders
        WHERE status IN ('received', 'preparing', 'ready')
        ORDER BY created_at ASC
    """)

    tickets_by_col = {
        "received": [],
        "preparing": [],
        "ready": []
    }

    now = datetime.datetime.now()

    for o in orders:
        items = query_all("SELECT * FROM order_items WHERE order_id = ?", (o["id"],))
        o["items"] = items
        
        # Calculate elapsed minutes
        try:
            created_dt = datetime.datetime.fromisoformat(o["created_at"])
            elapsed_sec = int((now - created_dt).total_seconds())
            elapsed_min = elapsed_sec // 60
            o["elapsed_seconds"] = elapsed_sec
            o["elapsed_str"] = f"{elapsed_min}m {elapsed_sec % 60}s"
            # Urgency flag
            if elapsed_min >= 15:
                o["urgency"] = "critical"
            elif elapsed_min >= 10:
                o["urgency"] = "warning"
            else:
                o["urgency"] = "normal"
        except Exception:
            o["elapsed_str"] = "1m"
            o["urgency"] = "normal"

        status_key = o["status"].lower()
        if status_key in tickets_by_col:
            tickets_by_col[status_key].append(o)

    return tickets_by_col

@router.post("/tickets/{order_id}/start-preparing")
async def start_preparing(order_id: str):
    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("UPDATE orders SET status = 'preparing', updated_at = ? WHERE id = ?", (now_iso, order_id))
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    await ws_manager.broadcast("order_status_updated", order)
    return {"status": "success", "order": order}

@router.post("/tickets/{order_id}/mark-ready")
async def mark_ready(order_id: str):
    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("UPDATE orders SET status = 'ready', updated_at = ? WHERE id = ?", (now_iso, order_id))
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    await ws_manager.broadcast("order_status_updated", order)
    return {"status": "success", "order": order}

@router.post("/tickets/{order_id}/complete")
async def complete_ticket(order_id: str):
    now_iso = datetime.datetime.now().isoformat()
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    execute_cmd("UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?", (now_iso, order_id))
    
    # If table is assigned, change to cleaning if paid
    if order and order["table_id"] and order["payment_status"] == "paid":
        execute_cmd("UPDATE restaurant_tables SET status = 'Cleaning', current_order_id = NULL, current_order_amount = 0 WHERE id = ?", (order["table_id"],))

    order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    await ws_manager.broadcast("order_status_updated", order)
    return {"status": "success", "order": order}
