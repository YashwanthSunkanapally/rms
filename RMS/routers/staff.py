"""
RESTO DADDY - Staff & Role Management Router
Staff roster, shift tracking, PIN-code switching, and table assignments.
"""

from fastapi import APIRouter, HTTPException
from database import query_all, query_one, execute_cmd
from models import StaffCreate
import uuid

router = APIRouter(prefix="/api/staff", tags=["Staff"])

@router.get("")
def list_staff(role: str = None):
    query = "SELECT * FROM staff WHERE 1=1"
    params = []
    if role:
        query += " AND role = ?"
        params.append(role)
    query += " ORDER BY role ASC, name ASC"
    
    staff_members = query_all(query, tuple(params))
    for s in staff_members:
        # Check active tables assigned
        tables = query_all("SELECT table_number FROM restaurant_tables WHERE assigned_waiter_id = ?", (s["id"],))
        s["assigned_tables"] = [t["table_number"] for t in tables]
    return staff_members

@router.post("")
def create_staff(payload: StaffCreate):
    staff_id = str(uuid.uuid4())
    execute_cmd("""
        INSERT INTO staff (id, name, role, email, phone, pin_code, shift, status, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        staff_id, payload.name, payload.role, payload.email, payload.phone,
        payload.pin_code or "1234", payload.shift, payload.status,
        payload.avatar_url or f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    ))
    return {"status": "success", "staff": query_one("SELECT * FROM staff WHERE id = ?", (staff_id,))}

@router.post("/verify-pin")
def verify_pin(pin: str):
    staff_member = query_one("SELECT id, name, role, avatar_url FROM staff WHERE pin_code = ?", (pin,))
    if not staff_member:
        raise HTTPException(status_code=401, detail="Invalid staff PIN")
    return {"status": "success", "staff": staff_member}
