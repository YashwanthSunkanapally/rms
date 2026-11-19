"""
RESTO DADDY - Customer CRM & Loyalty Router
Tracks guest dining histories, spend metrics, loyalty points, and preferences.
"""

from fastapi import APIRouter
from database import query_all, query_one, execute_cmd
from models import CustomerCreate
import uuid
import datetime

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("")
def list_customers(search: str = None):
    query = "SELECT * FROM customers WHERE 1=1"
    params = []
    if search:
        query += " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    query += " ORDER BY total_spend DESC LIMIT 50"
    return query_all(query, tuple(params))

@router.post("")
def create_customer(payload: CustomerCreate):
    cust = query_one("SELECT * FROM customers WHERE phone = ?", (payload.phone,))
    if cust:
        return {"status": "exists", "customer": cust}

    cust_id = str(uuid.uuid4())
    now_iso = datetime.datetime.now().isoformat()
    execute_cmd("""
        INSERT INTO customers (id, name, phone, email, total_orders, total_spend, loyalty_points, preferences, last_visit)
        VALUES (?, ?, ?, ?, 0, 0.0, 50, ?, ?)
    """, (cust_id, payload.name, payload.phone, payload.email or "", payload.preferences or "", now_iso))

    return {"status": "success", "customer": query_one("SELECT * FROM customers WHERE id = ?", (cust_id,))}
