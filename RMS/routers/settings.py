"""
RESTO DADDY - System Settings, Discounts & QR Configuration Router
Restaurant profile, GST rates, thermal printer options, and table QR code generation.
"""

from fastapi import APIRouter
from database import query_all, query_one, execute_cmd
from models import SettingUpdate
from typing import Dict, Any

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("")
def get_all_settings() -> Dict[str, Any]:
    rows = query_all("SELECT key, value FROM settings")
    settings = {r["key"]: r["value"] for r in rows}
    
    # Defaults
    defaults = {
        "restaurant_name": "Spicehollic",
        "tagline": "Run Your Restaurant Smarter.",
        "restaurant_address": "Plot 42, Gourmet Boulevard, Connaught Place, New Delhi",
        "phone": "+91 98765 43210",
        "email": "contact@spicehollic.com",
        "gstin": "07AAAAA0000A1Z5",
        "currency_symbol": "₹",
        "currency_code": "INR",
        "gst_rate": "5",
        "service_charge_rate": "0",
        "printer_width": "80mm",
        "sound_enabled": "true",
        "theme": "light",
        "active_branch": "Main Connaught Place Branch"
    }
    defaults.update(settings)
    return defaults

@router.post("")
def update_setting(payload: SettingUpdate):
    execute_cmd(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (payload.key, payload.value)
    )
    return {"status": "success", "key": payload.key, "value": payload.value}

@router.get("/discounts")
def list_discounts():
    return query_all("SELECT * FROM discounts WHERE is_active = 1")

@router.get("/branches")
def list_branches():
    return query_all("SELECT * FROM branches WHERE is_active = 1")

@router.get("/qr-codes")
def get_table_qr_data():
    tables = query_all("SELECT id, table_number, section FROM restaurant_tables ORDER BY table_number ASC")
    # Base URL for customer QR order
    qr_list = []
    for t in tables:
        qr_list.append({
            "table_number": t["table_number"],
            "section": t["section"],
            "qr_target_url": f"/qr?table={t['table_number']}",
            "qr_image_url": f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:8000/qr?table={t['table_number']}"
        })
    return qr_list
