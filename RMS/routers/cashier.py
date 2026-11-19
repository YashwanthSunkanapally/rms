"""
RESTO DADDY - Cashier Management & Register Settlement Router
Cash drawer session tracking, real-time bill settlement queue, tender/change calculator, and tender audits.
"""

from fastapi import APIRouter, HTTPException
from database import query_all, query_one, execute_cmd
from services.websocket_manager import ws_manager
from pydantic import BaseModel
from typing import Optional, Dict, Any
import datetime
import uuid

router = APIRouter(prefix="/api/cashier", tags=["Cashier"])

class SettlePaymentRequest(BaseModel):
    payment_method: str  # cash, upi, card, split
    amount_tendered: Optional[float] = 0.0

class CashMovementRequest(BaseModel):
    movement_type: str  # drop (deposit to safe) or payout (petty cash expense)
    amount: float
    reason: str

class CloseSessionRequest(BaseModel):
    counted_cash: float
    notes: Optional[str] = ""

@router.get("/summary")
def get_cashier_summary():
    today_str = datetime.date.today().isoformat()

    # Active cash session or auto-create default
    session = query_one("SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1")
    if not session:
        session_id = str(uuid.uuid4())
        now_iso = datetime.datetime.now().isoformat()
        execute_cmd("""
            INSERT INTO cash_sessions (id, cashier_id, cashier_name, opened_at, opening_float, status)
            VALUES (?, 'staff-4', 'Priya Kapoor', ?, 2000.0, 'open')
        """, (session_id, now_iso))
        session = query_one("SELECT * FROM cash_sessions WHERE id = ?", (session_id,))

    # Today's payment method breakdown
    paid_orders = query_all("SELECT payment_method, grand_total FROM orders WHERE payment_status = 'paid'")
    
    cash_total = sum(o["grand_total"] for o in paid_orders if o["payment_method"] == "cash")
    upi_total = sum(o["grand_total"] for o in paid_orders if o["payment_method"] == "upi")
    card_total = sum(o["grand_total"] for o in paid_orders if o["payment_method"] == "card")
    split_total = sum(o["grand_total"] for o in paid_orders if o["payment_method"] == "split")
    total_settled = sum(o["grand_total"] for o in paid_orders)

    # Movements
    movements = query_all("SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at DESC", (session["id"],))
    total_drops = sum(m["amount"] for m in movements if m["movement_type"] == "drop")
    total_payouts = sum(m["amount"] for m in movements if m["movement_type"] == "payout")

    opening_float = session["opening_float"] or 2000.0
    expected_cash_in_drawer = opening_float + cash_total - total_drops - total_payouts

    # Count of pending checks
    pending_count_row = query_one("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'unpaid'")
    pending_checks_count = pending_count_row["count"] if pending_count_row else 0

    return {
        "session": session,
        "opening_float": opening_float,
        "cash_total": cash_total,
        "upi_total": upi_total,
        "card_total": card_total,
        "split_total": split_total,
        "total_settled": total_settled,
        "total_bills_count": len(paid_orders),
        "total_drops": total_drops,
        "total_payouts": total_payouts,
        "expected_cash_in_drawer": round(expected_cash_in_drawer, 2),
        "pending_checks_count": pending_checks_count,
        "movements": movements
    }

@router.get("/pending-bills")
def get_pending_bills():
    """All active orders waiting for payment settlement."""
    orders = query_all("""
        SELECT o.id, o.order_number, o.order_type, o.table_number, o.customer_name,
               o.waiter_name, o.status, o.subtotal, o.gst_amount, o.discount_amount,
               o.grand_total, o.created_at,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        WHERE o.payment_status = 'unpaid'
        ORDER BY o.created_at ASC
    """)
    for ord in orders:
        ord["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (ord["id"],))
    return orders

@router.post("/settle/{order_id}")
async def settle_bill(order_id: str, payload: SettlePaymentRequest):
    order = query_one("SELECT * FROM orders WHERE id = ? OR order_number = ?", (order_id, order_id))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    real_id = order["id"]
    grand_total = order["grand_total"]
    change_due = 0.0

    if payload.payment_method == "cash" and payload.amount_tendered and payload.amount_tendered > grand_total:
        change_due = round(payload.amount_tendered - grand_total, 2)

    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("""
        UPDATE orders 
        SET payment_status = 'paid', payment_method = ?, updated_at = ?
        WHERE id = ?
    """, (payload.payment_method, now_iso, real_id))

    # If dine-in table, check if order is already completed; if so, table goes to Cleaning
    if order["table_id"]:
        if order["status"] == "completed":
            execute_cmd("UPDATE restaurant_tables SET status = 'Cleaning', current_order_id = NULL, current_order_amount = 0 WHERE id = ?", (order["table_id"],))
        else:
            execute_cmd("UPDATE restaurant_tables SET current_order_amount = 0 WHERE id = ?", (order["table_id"],))

    # Credit CRM points
    if order["customer_phone"]:
        cust = query_one("SELECT id FROM customers WHERE phone = ?", (order["customer_phone"],))
        pts = int(grand_total // 10)
        if cust:
            execute_cmd("UPDATE customers SET total_orders = total_orders + 1, total_spend = total_spend + ?, loyalty_points = loyalty_points + ? WHERE id = ?",
                        (grand_total, pts, cust["id"]))

    updated_order = query_one("SELECT * FROM orders WHERE id = ?", (real_id,))
    updated_order["items"] = query_all("SELECT * FROM order_items WHERE order_id = ?", (real_id,))
    
    await ws_manager.broadcast("order_paid", updated_order)

    return {
        "status": "success",
        "order": updated_order,
        "amount_paid": grand_total,
        "amount_tendered": payload.amount_tendered,
        "change_due": change_due
    }

@router.post("/cash-movement")
async def record_cash_movement(payload: CashMovementRequest):
    session = query_one("SELECT id FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1")
    if not session:
        raise HTTPException(status_code=400, detail="No active cash register session")

    movement_id = str(uuid.uuid4())
    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("""
        INSERT INTO cash_movements (id, session_id, movement_type, amount, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (movement_id, session["id"], payload.movement_type, payload.amount, payload.reason, now_iso))

    return {"status": "success", "movement_id": movement_id, "amount": payload.amount}

@router.post("/close-session")
async def close_cash_session(payload: CloseSessionRequest):
    session = query_one("SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1")
    if not session:
        raise HTTPException(status_code=400, detail="No open session found")

    paid_orders = query_all("SELECT grand_total FROM orders WHERE payment_status = 'paid' AND payment_method = 'cash'")
    cash_sales = sum(o["grand_total"] for o in paid_orders)
    
    movements = query_all("SELECT * FROM cash_movements WHERE session_id = ?", (session["id"],))
    total_drops = sum(m["amount"] for m in movements if m["movement_type"] == "drop")
    total_payouts = sum(m["amount"] for m in movements if m["movement_type"] == "payout")

    opening_float = session["opening_float"] or 2000.0
    expected_cash = opening_float + cash_sales - total_drops - total_payouts
    variance = round(payload.counted_cash - expected_cash, 2)

    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("""
        UPDATE cash_sessions 
        SET closed_at = ?, closing_cash = ?, expected_cash = ?, cash_drops = ?, petty_cash = ?, status = 'closed', notes = ?
        WHERE id = ?
    """, (now_iso, payload.counted_cash, expected_cash, total_drops, total_payouts, f"Variance: INR {variance}. {payload.notes}", session["id"]))

    return {
        "status": "success",
        "closed_at": now_iso,
        "opening_float": opening_float,
        "cash_sales": cash_sales,
        "counted_cash": payload.counted_cash,
        "expected_cash": expected_cash,
        "variance": variance
    }
