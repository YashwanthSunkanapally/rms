"""
RESTO DADDY - Comprehensive Seed Data Generator
Populates realistic tables, menu items with photos, inventory with recipes, staff, and orders.
"""

from database import init_db, get_db_connection, execute_cmd, execute_many
import datetime

def populate_seed_data():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing to ensure clean state
    cursor.execute("DELETE FROM sync_queue")
    cursor.execute("DELETE FROM discounts")
    cursor.execute("DELETE FROM order_items")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM recipe_items")
    cursor.execute("DELETE FROM inventory_items")
    cursor.execute("DELETE FROM menu_items")
    cursor.execute("DELETE FROM categories")
    cursor.execute("DELETE FROM restaurant_tables")
    cursor.execute("DELETE FROM staff")
    cursor.execute("DELETE FROM customers")
    cursor.execute("DELETE FROM branches")
    cursor.execute("DELETE FROM settings")

    # 1. Settings
    settings_data = [
        ("restaurant_name", "Spicehollic"),
        ("tagline", "Run Your Restaurant Smarter."),
        ("restaurant_address", "Plot 42, Gourmet Boulevard, Connaught Place, New Delhi"),
        ("phone", "+91 98765 43210"),
        ("email", "contact@spicehollic.com"),
        ("gstin", "07AAAAA0000A1Z5"),
        ("currency_symbol", "₹"),
        ("currency_code", "INR"),
        ("gst_rate", "5"),
        ("service_charge_rate", "0"),
        ("printer_width", "80mm"),
        ("sound_enabled", "true"),
        ("theme", "light"),
        ("active_branch", "CP - Inner Circle 3")
    ]
    cursor.executemany("INSERT INTO settings (key, value) VALUES (?, ?)", settings_data)

    # 2. Branches
    branches_data = [
        ("branch-1", "CP - Inner Circle 3", "Connaught Place, New Delhi", "+91 98765 43210", "07AAAAA0000A1Z5", 1),
        ("branch-2", "Lajpat Nagar Outlet", "Central Market, Lajpat Nagar II, New Delhi", "+91 98765 43211", "07AAAAA0000A1Z6", 1),
        ("branch-3", "Saket Outlet", "Select Citywalk Mall, Saket, New Delhi", "+91 98765 43212", "07AAAAA0000A1Z7", 1),
    ]
    cursor.executemany("INSERT INTO branches (id, name, address, phone, gstin, is_active) VALUES (?, ?, ?, ?, ?, ?)", branches_data)

    # 3. Staff
    staff_data = [
        ("staff-1", "Alex Vance", "Manager", "alex@restodaddy.com", "+91 98111 00001", "4444", "Full Day", "Active", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"),
        ("staff-2", "Marco Pierre", "Chef", "chef@restodaddy.com", "+91 98111 00002", "1111", "Morning", "Active", "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&q=80"),
        ("staff-3", "Dhruv Sharma", "Waiter", "dhruv@restodaddy.com", "+91 98111 00003", "2222", "Full Day", "Active", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80"),
        ("staff-4", "Priya Kapoor", "Cashier", "priya@restodaddy.com", "+91 98111 00004", "3333", "Evening", "Active", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80"),
    ]
    cursor.executemany("INSERT INTO staff (id, name, role, email, phone, pin_code, shift, status, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", staff_data)

    # 4. Tables
    tables_data = [
        ("tbl-01", "Inside 01", "Inside Dining", 2, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
        ("tbl-02", "Inside 02", "Inside Dining", 4, "Occupied", "staff-3", "Dhruv Sharma", "ord-seed-01", 840.0, "2026-11-18T06:30:00"),
        ("tbl-03", "Inside 03", "Inside Dining", 4, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
        ("tbl-04", "Inside 04", "Inside Dining", 6, "Cleaning", None, None, None, 0.0, None),
        ("tbl-05", "Inside 05", "Inside Dining", 4, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
        ("tbl-06", "Inside 06", "Inside Dining", 2, "Payment Pending", "staff-3", "Dhruv Sharma", "ord-seed-02", 1450.0, "2026-11-18T06:15:00"),
        ("tbl-07", "Table 10", "Inside Dining", 6, "Occupied", "staff-3", "Dhruv Sharma", "ord-seed-03", 1890.0, "2026-11-18T06:45:00"),
        ("tbl-08", "Terrace 01", "Terrace Garden", 4, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
        ("tbl-09", "Terrace 02", "Terrace Garden", 4, "Reserved", None, None, None, 0.0, None),
        ("tbl-10", "Terrace 03", "Terrace Garden", 6, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
        ("tbl-11", "Bar 01", "Bar Lounge", 2, "Available", None, None, None, 0.0, None),
        ("tbl-12", "Bar 02", "Bar Lounge", 2, "Occupied", "staff-3", "Dhruv Sharma", "ord-seed-04", 650.0, "2026-11-18T07:05:00"),
        ("tbl-13", "VIP 01", "VIP Private Room", 8, "Available", "staff-3", "Dhruv Sharma", None, 0.0, None),
    ]
    cursor.executemany("INSERT INTO restaurant_tables (id, table_number, section, capacity, status, assigned_waiter_id, assigned_waiter_name, current_order_id, current_order_amount, seated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", tables_data)

    # 5. Categories
    categories_data = [
        ("cat-all", "All", "all", "utensils", 0),
        ("cat-bev", "Beverages", "beverages", "coffee", 1),
        ("cat-bur", "Burgers", "burgers", "sandwich", 2),
        ("cat-com", "Combos", "combos", "flame", 3),
        ("cat-alc", "Drinks With Alcohol", "drinks-with-alcohol", "wine", 4),
        ("cat-piz", "Pizza", "pizza", "pizza", 5),
        ("cat-snk", "Snacks & Sides", "snacks-sides", "drumstick", 6),
        ("cat-swt", "Sweets & Desserts", "sweets", "cake", 7),
        ("cat-win", "Wines", "wines", "glass-water", 8),
    ]
    cursor.executemany("INSERT INTO categories (id, name, slug, icon, display_order) VALUES (?, ?, ?, ?, ?)", categories_data)

    # 6. Menu Items (with high-res food photos matching Image 3 Right and Image 1 Left)
    menu_items_data = [
        ("item-01", "cat-com", "Combo Big Burger", "COMBO-001", "Juicy double angus patty burger with golden fries and chilled soft beverage.", 399.0, 5.0, 0, "Medium", 15, "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80", 1, 1),
        ("item-02", "cat-bur", "Big Burger", "BURGER-001", "Flame grilled prime beef patty, aged cheddar cheese, lettuce, tomato & secret relish.", 299.0, 5.0, 0, "Mild", 12, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80", 1, 1),
        ("item-03", "cat-win", "Red Wine House", "REDWINE-001", "Full-bodied Cabernet Sauvignon with rich dark berry aromas and velvety finish.", 599.0, 5.0, 1, "None", 3, "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80", 1, 1),
        ("item-04", "cat-swt", "Cheesecake", "CHEESECAKE-001", "New York style baked cheesecake layered with fresh berry compote glaze.", 249.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500&q=80", 1, 1),
        ("item-05", "cat-swt", "Ice Cream Sundae", "ICECREAM-001", "Three scoops of gourmet gelato, warm fudge sauce, rainbow sprinkles & cherry.", 229.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80", 1, 0),
        ("item-06", "cat-swt", "Apple Pie", "APPLEPIE-002", "Warm flaky crust stuffed with spiced cinnamon apples and vanilla bean cream.", 189.0, 5.0, 1, "None", 8, "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=500&q=80", 1, 0),
        ("item-07", "cat-swt", "Chocolate Cake", "CHOCOLATEC-002", "Decadent multi-layered Belgian dark chocolate fudge cake with cocoa drizzle.", 219.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80", 1, 1),
        ("item-08", "cat-bev", "Milkshake Chocolate", "MILKSHAKE-CHOCO", "Rich Dutch chocolate thickshake blended with whole milk and brownie crumbles.", 199.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80", 1, 1),
        ("item-09", "cat-bev", "Milkshake Vanilla", "MILKSHAKE-VAN", "Madagascan vanilla bean shake whipped to creamy perfection with whipped cream.", 199.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&q=80", 1, 0),
        ("item-10", "cat-bev", "Iced Tea", "ICEDTEA-001", "Brewed black tea infused with fresh lemon wedges, mint leaves and cane sugar.", 149.0, 5.0, 1, "None", 4, "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80", 1, 1),
        ("item-11", "cat-com", "Truffle Pasta", "PASTA-001", "Handcrafted tagliatelle in rich black truffle cream sauce with aged Parmigiano Reggiano.", 699.0, 5.0, 1, "Mild", 18, "https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=500&q=80", 1, 1),
        ("item-12", "cat-snk", "Buffalo Wings", "WINGS-001", "Crispy glazed chicken wings tossed in tangy cayenne pepper buffalo sauce with celery.", 349.0, 5.0, 0, "Spicy", 14, "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&q=80", 1, 1),
        ("item-13", "cat-bur", "Ribeye Steak", "STEAK-001", "Prime 28-day dry aged ribeye steak seared with rosemary garlic butter & grilled asparagus.", 1199.0, 5.0, 0, "Medium", 22, "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80", 1, 1),
        ("item-14", "cat-snk", "Classic Bruschetta", "BRUSCHETTA-001", "Toasted sourdough ciabatta topped with heirloom tomatoes, fresh garlic, basil & EVOO.", 249.0, 5.0, 1, "Mild", 10, "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&q=80", 1, 0),
        ("item-15", "cat-com", "Fried Rice", "RICE-001", "Wok-tossed jasmine rice with farm eggs, scallions, roasted garlic and sesame soy.", 299.0, 5.0, 0, "Mild", 12, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80", 1, 0),
        ("item-16", "cat-bev", "Mango Juice", "MANGO-001", "Chilled Alphonso mango nectar blended with a hint of lime and mint.", 169.0, 5.0, 1, "None", 4, "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&q=80", 1, 1),
        ("item-17", "cat-swt", "Tiramisu", "TIRAMISU-001", "Authentic Italian savoiardi soaked in espresso and marsala wine, mascarpone cream & cocoa.", 279.0, 5.0, 1, "None", 5, "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80", 1, 1),
        ("item-18", "cat-piz", "Artisanal Pepperoni Pizza", "PIZZA-001", "Woodfired Neapolitan crust, San Marzano tomato sauce, spicy pepperoni & fresh mozzarella.", 549.0, 5.0, 0, "Medium", 16, "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80", 1, 1),
    ]
    cursor.executemany("""
        INSERT INTO menu_items (id, category_id, name, item_code, description, price, gst_rate, is_veg, spice_level, prep_time_min, image_url, is_available, is_popular)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, menu_items_data)

    # 7. Inventory Items (matching Image 1 Right "rista" style)
    now_iso = datetime.datetime.now().isoformat()
    inventory_data = [
        ("inv-01", "Refined Flour", "Bakery & Dough", 65.50, 100.0, "kg", 45.0, 4, "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&q=80", now_iso),
        ("inv-02", "Extra Virgin Olive Oil", "Oils & Sauces", 12.00, 25.0, "L", 850.0, 3, "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&q=80", now_iso),
        ("inv-03", "Basil Leaves", "Produce & Herbs", 1.20, 3.0, "kg", 250.0, 2, "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=120&q=80", now_iso),
        ("inv-04", "Spring Onions", "Produce & Herbs", 4.50, 10.0, "kg", 80.0, 3, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&q=80", now_iso),
        ("inv-05", "Chicken Wings", "Poultry & Meat", 48.00, 30.0, "kg", 220.0, 6, "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=120&q=80", now_iso),
        ("inv-06", "Angus Beef Patty", "Poultry & Meat", 35.00, 20.0, "kg", 450.0, 5, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&q=80", now_iso),
        ("inv-07", "Truffle Cream", "Oils & Sauces", 2.50, 5.0, "L", 1400.0, 4, "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=120&q=80", now_iso),
        ("inv-08", "Mozzarella Cheese", "Dairy", 28.00, 15.0, "kg", 380.0, 8, "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=120&q=80", now_iso),
    ]
    cursor.executemany("""
        INSERT INTO inventory_items (id, name, category, current_stock, min_threshold, unit, cost_per_unit, days_left, image_url, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, inventory_data)

    # 8. Recipes (Links menu items to inventory items for automatic stock deduction)
    recipe_data = [
        ("rec-01", "item-01", "inv-06", 0.20), # Combo burger takes 0.2kg patty
        ("rec-02", "item-02", "inv-06", 0.18), # Big burger takes 0.18kg patty
        ("rec-03", "item-11", "inv-07", 0.05), # Truffle pasta takes 0.05L truffle cream
        ("rec-04", "item-12", "inv-05", 0.35), # Buffalo wings takes 0.35kg chicken wings
        ("rec-05", "item-14", "inv-02", 0.02), # Bruschetta takes 0.02L olive oil
        ("rec-06", "item-14", "inv-03", 0.03), # Bruschetta takes 0.03kg basil
        ("rec-07", "item-18", "inv-01", 0.15), # Pizza takes 0.15kg flour
        ("rec-08", "item-18", "inv-08", 0.12), # Pizza takes 0.12kg mozzarella
    ]
    cursor.executemany("INSERT INTO recipe_items (id, menu_item_id, inventory_item_id, quantity_required) VALUES (?, ?, ?, ?)", recipe_data)

    # 9. Customers CRM
    customers_data = [
        ("cust-01", "Dhruv Sharma", "+91 98765 11111", "dhruv@gmail.com", 18, 14250.0, 142, "Prefers corner tables, extra spice", "2026-11-17T19:30:00"),
        ("cust-02", "Anya Mehta", "+91 98765 22222", "anya@gmail.com", 8, 7890.0, 78, "Gluten-conscious, loves Truffle Pasta", "2026-11-15T20:10:00"),
        ("cust-03", "Rohan Verma", "+91 98765 33333", "rohan@gmail.com", 24, 21400.0, 214, "Always orders Cabernet Sauvignon and Ribeye", "2026-11-18T01:20:00"),
        ("cust-04", "Simran Kaur", "+91 98765 44444", "simran@gmail.com", 12, 9800.0, 98, "Vegetarian, likes outdoor seating", "2026-11-16T14:45:00"),
    ]
    cursor.executemany("""
        INSERT INTO customers (id, name, phone, email, total_orders, total_spend, loyalty_points, preferences, last_visit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, customers_data)

    # 10. Discounts
    discounts_data = [
        ("disc-01", "RESTO20", "20% Discount for First-Time Diners", "percentage", 20.0, 500.0, 1),
        ("disc-02", "DADDY10", "10% Flat Discount for App Ordering", "percentage", 10.0, 250.0, 1),
        ("disc-03", "FLAT150", "Flat ₹150 OFF on orders above ₹1,000", "flat", 150.0, 1000.0, 1),
    ]
    cursor.executemany("INSERT INTO discounts (id, code, description, discount_type, discount_value, min_order_amount, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", discounts_data)

    # 11. Initial Orders matching Kitchen Display System (Image 2 Left)
    now = datetime.datetime.now()
    t_3min_ago = (now - datetime.timedelta(minutes=3)).isoformat()
    t_7min_ago = (now - datetime.timedelta(minutes=7)).isoformat()
    t_12min_ago = (now - datetime.timedelta(minutes=12)).isoformat()
    t_18min_ago = (now - datetime.timedelta(minutes=18)).isoformat()
    t_25min_ago = (now - datetime.timedelta(minutes=25)).isoformat()

    orders_seed = [
        # In Received Column:
        ("ord-seed-03", "ORD-000084", "dine_in", "tbl-07", "Table 10", "Rohan Verma", "+91 98765 33333", "staff-3", "Dhruv Sharma", "received", "unpaid", "card", 1548.0, 77.4, 0.0, 0.0, 1625.4, "Medium rare steak, buffalo wings with mild sauce", t_3min_ago, t_3min_ago),
        ("ord-seed-05", "ORD-000083", "dine_in", "tbl-07", "Table 10", "Rohan Verma", "+91 98765 33333", "staff-3", "Dhruv Sharma", "received", "unpaid", "cash", 349.0, 17.45, 0.0, 0.0, 366.45, "Crispy buffalo wings", t_7min_ago, t_7min_ago),
        ("ord-seed-06", "ORD-000082", "takeaway", None, "Takeaway #04", "Kabir Sen", "+91 98111 99999", "staff-4", "Priya Kapoor", "received", "paid", "upi", 1199.0, 59.95, 0.0, 0.0, 1258.95, "Packing for travel", t_18min_ago, t_18min_ago),
        
        # In Preparing Column:
        ("ord-seed-07", "ORD-000068", "dine_in", "tbl-07", "Table 10", "Rohan Verma", "+91 98765 33333", "staff-3", "Dhruv Sharma", "preparing", "unpaid", "cash", 349.0, 17.45, 0.0, 0.0, 366.45, "+ Mild Buffalo sauce", t_12min_ago, t_12min_ago),
        ("ord-seed-08", "ORD-000063", "dine_in", "tbl-07", "Table 10", "Rohan Verma", "+91 98765 33333", "staff-3", "Dhruv Sharma", "preparing", "unpaid", "cash", 498.0, 24.9, 0.0, 0.0, 522.9, "Iced tea with extra lemon slices", t_25min_ago, t_25min_ago),

        # In Ready Column:
        ("ord-seed-01", "ORD-000055", "dine_in", "tbl-02", "Inside 02", "Dhruv Sharma", "+91 98765 11111", "staff-3", "Dhruv Sharma", "ready", "unpaid", "upi", 840.0, 42.0, 0.0, 0.0, 882.0, "Ready for table runner", t_12min_ago, t_12min_ago),

        # Completed / Paid Orders:
        ("ord-seed-02", "ORD-000049", "dine_in", "tbl-06", "Inside 06", "Anya Mehta", "+91 98765 22222", "staff-3", "Dhruv Sharma", "completed", "paid", "upi", 1380.0, 69.0, 0.0, 0.0, 1449.0, "", t_25min_ago, t_25min_ago),
    ]

    cursor.executemany("""
        INSERT INTO orders (id, order_number, order_type, table_id, table_number, customer_name, customer_phone, waiter_id, waiter_name, status, payment_status, payment_method, subtotal, gst_amount, discount_amount, service_charge, grand_total, special_instructions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, orders_seed)

    # Order Items
    order_items_seed = [
        # For ORD-000084
        ("oi-01", "ord-seed-03", "item-12", "Buffalo Wings", 349.0, 1, "Mild Buffalo", "Extra crispy", "pending"),
        ("oi-02", "ord-seed-03", "item-13", "Ribeye Steak", 1199.0, 1, "Medium Rare", "Garlic butter", "pending"),
        # For ORD-000083
        ("oi-03", "ord-seed-05", "item-12", "Buffalo Wings", 349.0, 1, "Hot Buffalo", "", "pending"),
        # For ORD-000082
        ("oi-04", "ord-seed-06", "item-13", "Ribeye Steak", 1199.0, 1, "Medium", "Packed well", "pending"),
        # For ORD-000068
        ("oi-05", "ord-seed-07", "item-12", "Buffalo Wings", 349.0, 1, "Mild Buffalo", "", "preparing"),
        # For ORD-000063
        ("oi-06", "ord-seed-08", "item-12", "Buffalo Wings", 349.0, 1, "Mild", "", "preparing"),
        ("oi-07", "ord-seed-08", "item-10", "Iced Tea", 149.0, 1, "Extra Lemon", "", "preparing"),
        # For ORD-000055
        ("oi-08", "ord-seed-01", "item-14", "Classic Bruschetta", 249.0, 1, "Fresh Basil", "", "ready"),
        ("oi-09", "ord-seed-01", "item-02", "Big Burger", 299.0, 1, "Aged Cheddar", "", "ready"),
        ("oi-10", "ord-seed-01", "item-17", "Tiramisu", 279.0, 1, "", "", "ready"),
        # For ORD-000049
        ("oi-11", "ord-seed-02", "item-11", "Truffle Pasta", 699.0, 1, "Extra Truffle", "", "completed"),
        ("oi-12", "ord-seed-02", "item-16", "Mango Juice", 169.0, 2, "Chilled", "", "completed"),
        ("oi-13", "ord-seed-02", "item-04", "Cheesecake", 249.0, 1, "Berry glaze", "", "completed"),
    ]

    cursor.executemany("""
        INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, customizations, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, order_items_seed)

    conn.commit()
    conn.close()
    print("Seed data successfully populated!")

if __name__ == "__main__":
    populate_seed_data()
