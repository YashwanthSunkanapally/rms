"""
RESTO DADDY - Orders & POS Checkout Router
Handles instant order placement, KOT generation, offline synchronization, and WebSocket propagation.
"""

from fastapi import APIRouter, HTTPException
from database import query_all, query_one, execute_cmd, execute_many
from models import OrderCreate, OrderStatusUpdate, OrderPaymentUpdate, SyncBatch
from services.websocket_manager import ws_manager
from services.inventory_service import deduct_inventory_for_order
import uuid
import datetime
from typing import List, Dict, Any

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def calculate_order_totals(items: list, discount_code: str = "") -> dict:
    subtotal = sum(item.price * item.quantity for item in items)
    
    # 5% GST (2.5% CGST + 2.5% SGST standard Indian restaurant rate)
    gst_rate = 0.05
    gst_amount = round(subtotal * gst_rate, 2)
    
    discount_amount = 0.0
    if discount_code:
        coupon = query_one("SELECT * FROM discounts WHERE code = ? AND is_active = 1", (discount_code.upper(),))
        if coupon:
            if coupon["discount_type"] == "percentage":
                discount_amount = round((subtotal * coupon["discount_value"]) / 100.0, 2)
            else:
                discount_amount = min(subtotal, coupon["discount_value"])

    service_charge = 0.0  # Optional
    grand_total = max(0.0, round(subtotal + gst_amount - discount_amount + service_charge, 2))

    return {
        "subtotal": subtotal,
        "gst_amount": gst_amount,
        "discount_amount": discount_amount,
        "service_charge": service_charge,
        "grand_total": grand_total
    }

@router.get("")
def list_orders(status: str = None, order_type: str = None, limit: int = 50):
    query = "SELECT * FROM orders WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if order_type:
        query += " AND order_type = ?"
        params.append(order_type)
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    orders = query_all(query, tuple(params))
    for o in orders:
        o["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (o["id"],))
    return orders

@router.get("/{order_id}")
def get_order(order_id: str):
    order = query_one("SELECT * FROM orders WHERE id = ? OR order_number = ?", (order_id, order_id))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order["id"],))
    return order

@router.post("")
async def create_order(payload: OrderCreate):
    order_id = payload.order_id or str(uuid.uuid4())
    
    # Check if this order ID was already created (e.g. via offline sync retry)
    existing = query_one("SELECT id, order_number FROM orders WHERE id = ?", (order_id,))
    if existing:
        return {"status": "exists", "order_id": order_id, "order_number": existing["order_number"]}

    # Generate sequential friendly order number like ORD-000105
    count_row = query_one("SELECT COUNT(id) as count FROM orders")
    seq = (count_row["count"] or 0) + 101
    order_number = f"ORD-{seq:06d}"

    totals = calculate_order_totals(payload.items, payload.discount_code)
    now_iso = datetime.datetime.now().isoformat()

    execute_cmd("""
        INSERT INTO orders (
            id, order_number, order_type, table_id, table_number, customer_name, customer_phone,
            waiter_id, waiter_name, status, payment_status, payment_method, subtotal, gst_amount,
            discount_amount, service_charge, grand_total, special_instructions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order_id, order_number, payload.order_type, payload.table_id, payload.table_number,
        payload.customer_name or "Walk-in Guest", payload.customer_phone or "",
        payload.waiter_id, payload.waiter_name or "Self / QR",
        "received", "paid" if payload.is_paid else "unpaid", payload.payment_method or "cash",
        totals["subtotal"], totals["gst_amount"], totals["discount_amount"], totals["service_charge"],
        totals["grand_total"], payload.special_instructions or "", now_iso, now_iso
    ))

    # Insert items
    order_item_params = []
    for item in payload.items:
        item_id = str(uuid.uuid4())
        order_item_params.append((
            item_id, order_id, item.menu_item_id, item.name, item.price, item.quantity,
            item.customizations or "", item.notes or "", "pending"
        ))
    execute_many("""
        INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, customizations, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, order_item_params)

    # If dine_in with table, mark table Occupied
    if payload.table_id or payload.table_number:
        t_id = payload.table_id
        t_num = payload.table_number
        if t_id:
            execute_cmd("UPDATE restaurant_tables SET status = 'Occupied', current_order_id = ?, current_order_amount = ? WHERE id = ?",
                        (order_id, totals["grand_total"], t_id))
        elif t_num:
            execute_cmd("UPDATE restaurant_tables SET status = 'Occupied', current_order_id = ?, current_order_amount = ? WHERE table_number = ?",
                        (order_id, totals["grand_total"], t_num))

    # Deduct recipe inventory ingredients right away or on preparation
    await deduct_inventory_for_order(order_id)

    # Broadcast real-time order creation event to KDS, POS, Waiter, Admin
    full_order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    full_order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    
    await ws_manager.broadcast("order_created", full_order)

    return {
        "status": "success",
        "order_id": order_id,
        "order_number": order_number,
        "grand_total": totals["grand_total"],
        "created_at": now_iso
    }

@router.post("/sync")
async def sync_offline_orders(batch: SyncBatch):
    """
    Receives an array of offline-queued orders with client UUIDs.
    Inserts non-existing ones, prevents duplicates, returns synced IDs.
    """
    synced_ids = []
    for ord_data in batch.orders:
        res = await create_order(ord_data)
        synced_ids.append(res.get("order_id"))

    # Log sync batch
    execute_cmd("INSERT INTO sync_queue (id, client_timestamp, payload, status, synced_at) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), datetime.datetime.now().isoformat(), f"Synced {len(synced_ids)} orders from {batch.client_id}", "completed", datetime.datetime.now().isoformat()))

    return {"status": "success", "synced_count": len(synced_ids), "synced_ids": synced_ids}

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, payload: OrderStatusUpdate):
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = payload.status.lower()
    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", (new_status, now_iso, order_id))

    # If completed or cancelled, handle table status
    if new_status in ["completed", "cancelled"] and order["table_id"]:
        # If order is paid and completed, table becomes Cleaning
        if order["payment_status"] == "paid":
            execute_cmd("UPDATE restaurant_tables SET status = 'Cleaning', current_order_id = NULL, current_order_amount = 0 WHERE id = ?", (order["table_id"],))

    updated_order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    updated_order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))

    # Broadcast status change across all devices
    await ws_manager.broadcast("order_status_updated", updated_order)
    return {"status": "success", "order": updated_order}

@router.patch("/{order_id}/payment")
async def process_payment(order_id: str, payload: OrderPaymentUpdate):
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now_iso = datetime.datetime.now().isoformat()
    execute_cmd(
        "UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = ? WHERE id = ?",
        (payload.payment_status, payload.payment_method, now_iso, order_id)
    )

    # If customer phone exists, update CRM spending and loyalty points
    if order["customer_phone"]:
        cust = query_one("SELECT id, total_orders, total_spend, loyalty_points FROM customers WHERE phone = ?", (order["customer_phone"],))
        points_earned = int(order["grand_total"] // 10) # 1 pt per 10 INR
        if cust:
            execute_cmd("""
                UPDATE customers SET total_orders = total_orders + 1, total_spend = total_spend + ?, loyalty_points = loyalty_points + ?, last_visit = ?
                WHERE id = ?
            """, (order["grand_total"], points_earned, now_iso, cust["id"]))
        elif order["customer_name"] and order["customer_name"] != "Walk-in Guest":
            execute_cmd("""
                INSERT INTO customers (id, name, phone, email, total_orders, total_spend, loyalty_points, preferences, last_visit)
                VALUES (?, ?, ?, '', 1, ?, ?, '', ?)
            """, (str(uuid.uuid4()), order["customer_name"], order["customer_phone"], order["grand_total"], points_earned, now_iso))

    updated_order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    await ws_manager.broadcast("order_paid", updated_order)
    return {"status": "success", "order": updated_order}
