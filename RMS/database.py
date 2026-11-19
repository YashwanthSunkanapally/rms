"""
RESTO DADDY - Central Database Layer
High-performance SQLite engine with WAL mode for concurrent POS, KDS, Waiter, and Customer access.
"""

import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resto_daddy.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Branches & Settings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        gstin TEXT,
        is_active INTEGER DEFAULT 1
    );
    """)

    # Restaurant Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS restaurant_tables (
        id TEXT PRIMARY KEY,
        table_number TEXT NOT NULL UNIQUE,
        section TEXT DEFAULT 'Inside Dining',
        capacity INTEGER DEFAULT 4,
        status TEXT DEFAULT 'Available',
        assigned_waiter_id TEXT,
        assigned_waiter_name TEXT,
        current_order_id TEXT,
        current_order_amount REAL DEFAULT 0.0,
        seated_at TEXT
    );
    """)

    # Menu Categories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        icon TEXT,
        display_order INTEGER DEFAULT 0
    );
    """)

    # Menu Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        category_id TEXT,
        name TEXT NOT NULL,
        item_code TEXT,
        description TEXT,
        price REAL NOT NULL,
        gst_rate REAL DEFAULT 5.0,
        is_veg INTEGER DEFAULT 1,
        spice_level TEXT DEFAULT 'Mild',
        prep_time_min INTEGER DEFAULT 15,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        is_popular INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );
    """)

    # Inventory Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        current_stock REAL NOT NULL,
        min_threshold REAL NOT NULL,
        unit TEXT NOT NULL,
        cost_per_unit REAL DEFAULT 0.0,
        days_left INTEGER DEFAULT 7,
        image_url TEXT,
        last_updated TEXT
    );
    """)

    # Recipe mapping (Ingredient consumption per Menu Item)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recipe_items (
        id TEXT PRIMARY KEY,
        menu_item_id TEXT NOT NULL,
        inventory_item_id TEXT NOT NULL,
        quantity_required REAL NOT NULL,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id) ON DELETE CASCADE
    );
    """)

    # Staff Members
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        pin_code TEXT DEFAULT '1234',
        shift TEXT DEFAULT 'Full Day',
        status TEXT DEFAULT 'Active',
        avatar_url TEXT
    );
    """)

    # Customers CRM
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT UNIQUE,
        email TEXT,
        total_orders INTEGER DEFAULT 0,
        total_spend REAL DEFAULT 0.0,
        loyalty_points INTEGER DEFAULT 0,
        preferences TEXT,
        last_visit TEXT
    );
    """)

    # Orders
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        order_type TEXT DEFAULT 'dine_in',
        table_id TEXT,
        table_number TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        waiter_id TEXT,
        waiter_name TEXT,
        status TEXT DEFAULT 'received',
        payment_status TEXT DEFAULT 'unpaid',
        payment_method TEXT DEFAULT 'cash',
        subtotal REAL DEFAULT 0.0,
        gst_amount REAL DEFAULT 0.0,
        discount_amount REAL DEFAULT 0.0,
        service_charge REAL DEFAULT 0.0,
        grand_total REAL DEFAULT 0.0,
        special_instructions TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_offline_synced INTEGER DEFAULT 0
    );
    """)

    # Order Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        customizations TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );
    """)

    # Discounts and Coupons
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        discount_type TEXT DEFAULT 'percentage',
        discount_value REAL NOT NULL,
        min_order_amount REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1
    );
    """)

    # Cashier Shift & Drawer Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cash_sessions (
        id TEXT PRIMARY KEY,
        cashier_id TEXT,
        cashier_name TEXT,
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        opening_float REAL DEFAULT 2000.0,
        closing_cash REAL DEFAULT 0.0,
        expected_cash REAL DEFAULT 0.0,
        cash_drops REAL DEFAULT 0.0,
        petty_cash REAL DEFAULT 0.0,
        status TEXT DEFAULT 'open',
        notes TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cash_movements (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        movement_type TEXT NOT NULL, -- 'drop' or 'payout'
        amount REAL NOT NULL,
        reason TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Offline Sync Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        client_timestamp TEXT,
        payload TEXT,
        status TEXT DEFAULT 'processed',
        synced_at TEXT
    );
    """)

    conn.commit()
    conn.close()

def query_all(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    result = [dict(row) for row in rows]
    conn.close()
    return result

def query_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def execute_cmd(sql: str, params: tuple = ()) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, params)
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id

def execute_many(sql: str, param_list: List[tuple]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executemany(sql, param_list)
    conn.commit()
    conn.close()
