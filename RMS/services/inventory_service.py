"""
RESTO DADDY - Automated Inventory & Recipe Consumption Service
Automatically deducts raw ingredients from inventory when menu items are ordered/prepared.
"""

from database import query_all, query_one, execute_cmd
from services.websocket_manager import ws_manager
import datetime
import logging

logger = logging.getLogger("resto_daddy.inventory")

async def deduct_inventory_for_order(order_id: str):
    """
    Deducts raw ingredients linked via recipe_items for all items in this order.
    """
    items = query_all("SELECT menu_item_id, quantity FROM order_items WHERE order_id = ?", (order_id,))
    now_iso = datetime.datetime.now().isoformat()
    low_stock_alerts = []

    for item in items:
        menu_item_id = item["menu_item_id"]
        qty_ordered = item["quantity"]

        recipes = query_all(
            "SELECT inventory_item_id, quantity_required FROM recipe_items WHERE menu_item_id = ?",
            (menu_item_id,)
        )

        for rec in recipes:
            inv_id = rec["inventory_item_id"]
            amount_needed = rec["quantity_required"] * qty_ordered

            inv = query_one("SELECT id, name, current_stock, min_threshold, unit FROM inventory_items WHERE id = ?", (inv_id,))
            if inv:
                new_stock = max(0.0, inv["current_stock"] - amount_needed)
                execute_cmd(
                    "UPDATE inventory_items SET current_stock = ?, last_updated = ? WHERE id = ?",
                    (round(new_stock, 3), now_iso, inv_id)
                )

                if new_stock <= inv["min_threshold"]:
                    low_stock_alerts.append({
                        "id": inv["id"],
                        "name": inv["name"],
                        "current_stock": new_stock,
                        "min_threshold": inv["min_threshold"],
                        "unit": inv["unit"]
                    })

    if low_stock_alerts:
        await ws_manager.broadcast("inventory_low_stock", {"alerts": low_stock_alerts})

    await ws_manager.broadcast("inventory_updated", {"order_id": order_id})
