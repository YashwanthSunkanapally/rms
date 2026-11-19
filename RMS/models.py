"""
RESTO DADDY - Pydantic Data Validation Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SettingUpdate(BaseModel):
    key: str
    value: str

class TableCreate(BaseModel):
    table_number: str
    section: str = "Inside Dining"
    capacity: int = 4
    status: str = "Available"
    assigned_waiter_id: Optional[str] = None
    assigned_waiter_name: Optional[str] = None

class TableStatusUpdate(BaseModel):
    status: str
    assigned_waiter_id: Optional[str] = None
    assigned_waiter_name: Optional[str] = None
    current_order_id: Optional[str] = None
    current_order_amount: Optional[float] = 0.0

class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = "utensils"
    display_order: Optional[int] = 0

class MenuItemCreate(BaseModel):
    category_id: str
    name: str
    item_code: Optional[str] = None
    description: Optional[str] = ""
    price: float
    gst_rate: Optional[float] = 5.0
    is_veg: Optional[int] = 1
    spice_level: Optional[str] = "Mild"
    prep_time_min: Optional[int] = 15
    image_url: Optional[str] = None
    is_available: Optional[int] = 1
    is_popular: Optional[int] = 0

class MenuItemAvailability(BaseModel):
    is_available: int

class OrderItemInput(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int = 1
    customizations: Optional[str] = ""
    notes: Optional[str] = ""

class OrderCreate(BaseModel):
    order_id: Optional[str] = None  # Client UUID for offline resilience
    order_type: str = "dine_in"     # dine_in, takeaway, delivery
    table_id: Optional[str] = None
    table_number: Optional[str] = None
    customer_name: Optional[str] = "Walk-in Guest"
    customer_phone: Optional[str] = ""
    waiter_id: Optional[str] = None
    waiter_name: Optional[str] = None
    items: List[OrderItemInput]
    special_instructions: Optional[str] = ""
    discount_code: Optional[str] = ""
    payment_method: Optional[str] = "cash"
    is_paid: Optional[bool] = False

class OrderStatusUpdate(BaseModel):
    status: str  # received, preparing, ready, completed, cancelled

class OrderPaymentUpdate(BaseModel):
    payment_status: str  # paid, unpaid, refunded
    payment_method: str  # cash, upi, card, split
    grand_total: Optional[float] = None

class InventoryAdjust(BaseModel):
    quantity_change: float
    reason: str  # restock, wastage, discrepancy_audit, manual
    cost: Optional[float] = 0.0

class StaffCreate(BaseModel):
    name: str
    role: str  # Super Admin, Manager, Cashier, Waiter, Chef
    email: Optional[str] = ""
    phone: Optional[str] = ""
    pin_code: Optional[str] = "1234"
    shift: Optional[str] = "Full Day"
    status: Optional[str] = "Active"
    avatar_url: Optional[str] = None

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    preferences: Optional[str] = ""

class SyncBatch(BaseModel):
    client_id: str
    orders: List[OrderCreate]
