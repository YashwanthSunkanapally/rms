# 🌶️ SPICEHOLLIC — Premium Restaurant Management & POS Ecosystem

> **"Run Your Restaurant Smarter."**  
> A high-performance, full-stack commercial SaaS restaurant management platform built with **Python (FastAPI + SQLite + WebSockets)** and a **Stripe / Linear / Toast POS-grade design system**.

---

## 🌟 Visual Design System & Aesthetic Heritage

Spicehollic harmonizes the design tokens defined in [`DESIGN.md`](./DESIGN.md) and reference industry design standards:
- **Warm Editorial Canvas:** Cream canvas (`#FAF9F5` / `#F7F8FA`) with refined borders (`#E2E8F0` / `#E6DFD8`).
- **Signature Brand Accent:** Warm Spicehollic Orange (`#F97316` / `#EA580C`), secondary apricot (`#FDBA74`), and soft peach backgrounds (`#FFF7ED`).
- **Surfaces & Sidebar:** Dark navy/slate sidebar (`#111827`) with active glowing accents and micro-interaction hover states.
- **Typography:** Display headlines in Manrope / Inter with tabular numbers (`tnum`) for monetary precision.
- **Imagery:** Curated high-resolution culinary photography for every menu item and inventory ingredient.

---

## 📸 Reference Screens Implemented

| View | Description | Key Capabilities |
| :--- | :--- | :--- |
| **1. Admin Dashboard** | Executive KPIs & Analytics | Dual-line Income vs. Expense trend chart, category breakdown donut, today's revenue, active tables, recent orders table. |
| **2. Cashier Dashboard** | Shift & Bill Settlement | Live expected cash in drawer, safe cash drops, petty cash payouts, unsettled bills queue, fast tender change calculator, and closing Z-Report. |
| **3. Point of Sale (POS)** | Fast Food Selection & Billing | Category horizontal pills, live search, veg/non-veg filter, item cards, cart drawer with GST, discounts, Cash, dynamic UPI QR modal, Card, and Split Payment. |
| **4. Kitchen Display (KDS)** | Dark Kitchen Interface | Real-time Kanban columns (*Received*, *Preparing*, *Ready*), elapsed prep timers with urgency colors, special cooking notes, and audio chime bell. |
| **5. Waiter Mobile App** | Mobile-First Server Interface | Floor plan table selection, opened checks, quick tap item quantity steppers, and instant KOT submission to kitchen. |
| **6. Customer QR Menu** | Digital Self-Ordering | Table auto-detection (`?table=Inside 02`), *"Hot Deals Now!"* countdown banner, veg/non-veg tags, customizable orders, review & submit, and real-time order tracking. |
| **7. Inventory & Recipes** | Multi-Outlet Stock & Wastage | Stock valuation in INR, mismatch discrepancy value, wastage donut chart (*Damage, PO issues, Expiry*), ingredient reorder alerts, and recipe-based stock deduction. |

---

## ⚡ Real-Time WebSockets & Sound Alerts

All modules communicate bidirectionally with the central backend over `/ws`:
- **Instant KOT Generation:** When an order is placed from the POS, Waiter App, or Customer QR, it immediately pushes a ticket to the Kitchen Display System without polling.
- **Kitchen Order Chime:** Synthesized two-tone audio alert (880Hz → 1320Hz) via the HTML5 Web Audio API plays automatically when a new KOT arrives (with mute toggle).
- **Live State Transitions:** Status updates (*Received → Preparing → Ready → Completed*) update table occupancy and customer order tracking screens in real time.
- **Stock Availability Sync:** Marking an item out of stock in Menu Admin instantly disables it across POS, Waiter, and Customer QR terminals.

---

## 🛡️ Offline-First Resilience Engine

The POS and ordering systems remain operational even when internet connectivity drops:
1. **Local Queueing:** Offline orders are stored in `localStorage` / `IndexedDB` with unique client-side UUIDs (`crypto.randomUUID`).
2. **Visual Status Badge:** Real-time indicator displays `🟢 Online`, `🟠 Offline (X Queued)`, or `🔵 Syncing`.
3. **Automatic Reconnection Sync:** When connectivity returns, pending orders are flushed in a batch to `/api/orders/sync`, deduplicated, and reconciled into the database.
4. **Simulation Toggle:** A button in Settings allows instant simulation of offline mode for demonstration and training.

---

## 🧾 Billing, Taxes & PDF Generation

- **Indian GST Compliance:** 5% standard restaurant GST (configurable) calculated with clear **2.5% CGST** and **2.5% SGST** breakdowns.
- **ReportLab PDF Invoices:** High-fidelity printable PDF tax invoices with restaurant header, GSTIN, tabular breakdown, and payment details.
- **Thermal Slip Printing:** 80mm stylized receipt preview with one-click thermal printing via `@media print`.
- **Executive CSV & PDF Reports:** Export sales reports with one click.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.10+ (Python 3.14 recommended)
- All required packages (`fastapi`, `uvicorn`, `websockets`, `pydantic`, `reportlab`, `sqlalchemy`) are included in your Python environment.

### 2. Launch the Application

#### Option A: One-Click Batch File (Windows)
Double-click [`run.bat`](./run.bat) in the project directory.

#### Option B: PowerShell
```powershell
.\run.ps1
```

#### Option C: Python Command
```powershell
python main.py
```
*(If Python is not in your global PATH, run via `& "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe" main.py`)*

### 3. Access the Application
Open your browser to:
- **Main Admin Suite:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **POS Terminal:** [http://127.0.0.1:8000/pos](http://127.0.0.1:8000/pos)
- **Kitchen Display System (KDS):** [http://127.0.0.1:8000/kds](http://127.0.0.1:8000/kds)
- **Waiter Mobile App:** [http://127.0.0.1:8000/waiter](http://127.0.0.1:8000/waiter)
- **Customer QR Menu:** [http://127.0.0.1:8000/qr?table=Inside%2002](http://127.0.0.1:8000/qr?table=Inside%2002)
- **Inventory Overview:** [http://127.0.0.1:8000/inventory](http://127.0.0.1:8000/inventory)
- **Interactive API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📂 Project Directory Structure

```
RMS/
├── DESIGN.md                      # Design tokens, color palette, typography guidelines
├── README.md                      # Ecosystem documentation & guide
├── main.py                        # FastAPI entrypoint, router mounts & static serving
├── database.py                    # SQLite engine with WAL mode and schema definitions
├── models.py                      # Pydantic data validation models
├── seed_data.py                   # Realistic seed generator matching reference screenshots
├── run.bat                        # Windows 1-click batch launcher
├── run.ps1                        # PowerShell launcher
├── routers/
│   ├── dashboard.py               # Stats, income/expenses chart data, recent orders
│   ├── orders.py                  # POS checkout, KOT creation, offline batch sync
│   ├── tables.py                  # Visual floor plan, table status & waiter assignment
│   ├── menu.py                    # Menu items, categories & instant stock toggles
│   ├── kds.py                     # Kitchen Kanban tickets, preparation timers & actions
│   ├── inventory.py               # Stock overview, mismatch values & wastage analytics
│   ├── staff.py                   # Staff roster, roles, shifts & PIN authorization
│   ├── customers.py               # CRM, spend metrics & loyalty rewards
│   ├── billing.py                 # Split bill calculator, payments & tax receipts
│   ├── reports.py                 # Best sellers, CSV export & executive summary
│   └── settings.py                # Restaurant profile, GSTIN & table QR code generation
├── services/
│   ├── websocket_manager.py       # Real-time WebSocket connection manager & broadcast
│   ├── inventory_service.py       # Automated recipe ingredient stock deduction
│   └── pdf_service.py             # ReportLab PDF invoice & executive report generator
└── static/
    ├── index.html                 # Central SPA shell with collapsible sidebar & top bar
    ├── css/
    │   └── styles.css             # Custom styles, design tokens, print & mobile bezel frames
    └── js/
        ├── websocket.js           # Auto-reconnecting WebSocket client & Web Audio chime
        ├── offline.js             # Offline queue manager & auto-sync engine
        └── app.js                 # Complete reactive application controller
```
