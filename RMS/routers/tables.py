"""
RESTO DADDY - Floor Plan & Table Management Router
Visual restaurant table management, capacity, waiter assignment, and state changes.
"""

from fastapi import APIRouter, HTTPException
from database import query_all, query_one, execute_cmd
from models import TableCreate, TableStatusUpdate
from services.websocket_manager import ws_manager
import uuid

router = APIRouter(prefix="/api/tables", tags=["Tables"])

@router.get("")
def list_tables(section: str = None):
    query = "SELECT * FROM restaurant_tables WHERE 1=1"
    params = []
    if section:
        query += " AND section = ?"
        params.append(section)
    query += " ORDER BY table_number ASC"
    
    tables = query_all(query, tuple(params))
    # Enrich with latest order items if occupied
    for t in tables:
        if t["current_order_id"]:
            ord_info = query_one("SELECT order_number, grand_total, created_at, status FROM orders WHERE id = ?", (t["current_order_id"],))
            t["active_order"] = ord_info
        else:
            t["active_order"] = None
    return tables

@router.post("")
async def create_table(payload: TableCreate):
    existing = query_one("SELECT id FROM restaurant_tables WHERE table_number = ?", (payload.table_number,))
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")

    t_id = str(uuid.uuid4())
    execute_cmd("""
        INSERT INTO restaurant_tables (id, table_number, section, capacity, status, assigned_waiter_id, assigned_waiter_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (t_id, payload.table_number, payload.section, payload.capacity, payload.status, payload.assigned_waiter_id, payload.assigned_waiter_name))

    table = query_one("SELECT * FROM restaurant_tables WHERE id = ?", (t_id,))
    await ws_manager.broadcast("table_updated", table)
    return {"status": "success", "table": table}

@router.patch("/{table_id}/status")
async def update_table_status(table_id: str, payload: TableStatusUpdate):
    table = query_one("SELECT * FROM restaurant_tables WHERE id = ? OR table_number = ?", (table_id, table_id))
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    real_id = table["id"]
    execute_cmd("""
        UPDATE restaurant_tables 
        SET status = ?, assigned_waiter_id = COALESCE(?, assigned_waiter_id),
            assigned_waiter_name = COALESCE(?, assigned_waiter_name),
            current_order_id = COALESCE(?, current_order_id),
            current_order_amount = COALESCE(?, current_order_amount)
        WHERE id = ?
    """, (payload.status, payload.assigned_waiter_id, payload.assigned_waiter_name, payload.current_order_id, payload.current_order_amount, real_id))

    updated_table = query_one("SELECT * FROM restaurant_tables WHERE id = ?", (real_id,))
    await ws_manager.broadcast("table_updated", updated_table)
    return {"status": "success", "table": updated_table}

@router.post("/transfer")
async def transfer_table_order(source_table: str, target_table: str):
    src = query_one("SELECT * FROM restaurant_tables WHERE table_number = ? OR id = ?", (source_table, source_table))
    tgt = query_one("SELECT * FROM restaurant_tables WHERE table_number = ? OR id = ?", (target_table, target_table))
    
    if not src or not tgt:
        raise HTTPException(status_code=404, detail="Source or target table not found")
    if not src["current_order_id"]:
        raise HTTPException(status_code=400, detail="Source table has no active order")

    order_id = src["current_order_id"]
    order_amount = src["current_order_amount"]

    # Transfer order reference
    execute_cmd("UPDATE orders SET table_id = ?, table_number = ? WHERE id = ?", (tgt["id"], tgt["table_number"], order_id))
    execute_cmd("UPDATE restaurant_tables SET status = 'Occupied', current_order_id = ?, current_order_amount = ? WHERE id = ?", (order_id, order_amount, tgt["id"]))
    execute_cmd("UPDATE restaurant_tables SET status = 'Cleaning', current_order_id = NULL, current_order_amount = 0 WHERE id = ?", (src["id"],))

    await ws_manager.broadcast("table_updated", {"transfer": "completed", "from": src["table_number"], "to": tgt["table_number"]})
    return {"status": "success", "message": f"Order transferred from {src['table_number']} to {tgt['table_number']}"}

@router.delete("/{table_id}")
async def delete_table(table_id: str):
    execute_cmd("DELETE FROM restaurant_tables WHERE id = ?", (table_id,))
    await ws_manager.broadcast("table_deleted", {"table_id": table_id})
    return {"status": "success"}
