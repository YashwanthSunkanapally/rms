"""
RESTO DADDY - Menu & Category Management Router
Dynamic food catalogue, availability toggle, pricing, and category organization.
"""

from fastapi import APIRouter, HTTPException
from database import query_all, query_one, execute_cmd
from models import MenuItemCreate, MenuItemAvailability, CategoryCreate
from services.websocket_manager import ws_manager
import uuid

router = APIRouter(prefix="/api/menu", tags=["Menu"])

@router.get("/categories")
def list_categories():
    return query_all("SELECT * FROM categories ORDER BY display_order ASC, name ASC")

@router.post("/categories")
async def create_category(payload: CategoryCreate):
    cat_id = str(uuid.uuid4())
    slug = payload.slug or payload.name.lower().replace(" ", "-")
    execute_cmd(
        "INSERT INTO categories (id, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)",
        (cat_id, payload.name, slug, payload.icon, payload.display_order)
    )
    return {"status": "success", "category": query_one("SELECT * FROM categories WHERE id = ?", (cat_id,))}

@router.get("/items")
def list_menu_items(category_id: str = None, is_veg: int = None, available_only: bool = False, search: str = None):
    query = """
        SELECT m.*, c.name as category_name
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE 1=1
    """
    params = []
    if category_id and category_id != 'all':
        query += " AND (m.category_id = ? OR c.slug = ?)"
        params.extend([category_id, category_id])
    if is_veg is not None:
        query += " AND m.is_veg = ?"
        params.append(is_veg)
    if available_only:
        query += " AND m.is_available = 1"
    if search:
        query += " AND (m.name LIKE ? OR m.description LIKE ? OR m.item_code LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY m.is_popular DESC, m.name ASC"
    return query_all(query, tuple(params))

@router.get("/items/{item_id}")
def get_menu_item(item_id: str):
    item = query_one("SELECT * FROM menu_items WHERE id = ?", (item_id,))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/items")
async def create_menu_item(payload: MenuItemCreate):
    item_id = str(uuid.uuid4())
    code = payload.item_code or f"RD-{item_id[:4].upper()}"
    execute_cmd("""
        INSERT INTO menu_items (
            id, category_id, name, item_code, description, price, gst_rate,
            is_veg, spice_level, prep_time_min, image_url, is_available, is_popular
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item_id, payload.category_id, payload.name, code, payload.description,
        payload.price, payload.gst_rate, payload.is_veg, payload.spice_level,
        payload.prep_time_min, payload.image_url, payload.is_available, payload.is_popular
    ))

    new_item = query_one("SELECT * FROM menu_items WHERE id = ?", (item_id,))
    await ws_manager.broadcast("menu_item_created", new_item)
    return {"status": "success", "item": new_item}

@router.patch("/items/{item_id}/availability")
async def toggle_availability(item_id: str, payload: MenuItemAvailability):
    execute_cmd("UPDATE menu_items SET is_available = ? WHERE id = ?", (payload.is_available, item_id))
    item = query_one("SELECT * FROM menu_items WHERE id = ?", (item_id,))
    # Broadcast availability to POS, Waiter, and Customer QR immediately
    await ws_manager.broadcast("menu_stock_updated", item)
    return {"status": "success", "item": item}

@router.delete("/items/{item_id}")
async def delete_menu_item(item_id: str):
    execute_cmd("DELETE FROM menu_items WHERE id = ?", (item_id,))
    await ws_manager.broadcast("menu_item_deleted", {"item_id": item_id})
    return {"status": "success"}
