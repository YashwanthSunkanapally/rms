# 🍽️ Restaurant Management System

A modern, full-stack Restaurant Management System designed to simplify restaurant operations by managing orders, tables, menus, kitchen activities, billing, and staff through a centralized platform.

The system provides separate dashboards for Admin, Waiter, Chef, and Cashier, ensuring smooth communication and real-time order management.

---

## 📌 Project Overview

The Restaurant Management System helps restaurants manage their daily activities digitally.

Instead of handling orders, billing, and kitchen operations manually, this application provides an integrated solution where every department can access the information they need.

### 🎯 Main Objectives

- Simplify restaurant operations.
- Manage customer orders efficiently.
- Track table availability.
- Manage food menus and categories.
- Provide real-time kitchen order updates.
- Generate accurate customer bills.
- Monitor restaurant sales and performance.
- Manage staff and user permissions.

---

## ✨ Key Features

### 1. Admin Dashboard
- View total sales and revenue.
- Monitor total orders.
- Manage restaurant staff.
- Add, edit, and delete menu items.
- Manage food categories.
- Monitor table availability.
- View sales reports and analytics.
- Manage restaurant settings.

### 2. Waiter Dashboard
- View available and occupied tables.
- Create new customer orders.
- Select food items from the menu.
- Update order quantities.
- Add special instructions.
- Send orders directly to the kitchen.
- Track order preparation status.

### 3. Chef / Kitchen Dashboard
- View incoming customer orders.
- Display ordered food items.
- View special cooking instructions.
- Update order status:
  - Pending
  - Preparing
  - Ready
  - Completed
- Notify waiters when orders are ready.

### 4. Cashier Dashboard
- View completed and pending orders.
- Generate customer bills.
- Calculate subtotal and taxes.
- Apply discounts.
- Manage payment status.
- Support cash, UPI, and card payment records.
- Generate printable receipts.

### 5. Table Management
- Add and manage restaurant tables.
- Track table availability.
- Assign orders to tables.
- Manage occupied and reserved tables.
- Update table status automatically.

### 6. Menu Management
- Add new food items.
- Upload food images.
- Set item prices.
- Organize food categories.
- Mark items as available or unavailable.
- Update menu information.

---

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin | Complete restaurant management |
| Waiter | Table and customer order management |
| Chef | Kitchen order preparation |
| Cashier | Billing and payment management |

---

## 🛠️ Technologies Used

The technology stack can be adjusted according to the implementation.

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| UI Framework | Bootstrap / React |
| Backend | Python |
| Backend Framework | Flask / Django |
| Database | MySQL / SQLite |
| API | REST API |
| Authentication | Session / JWT |
| Version Control | Git & GitHub |
| Code Editor | Visual Studio Code |

---

## 📂 Project Structure

```text
restaurant-management-system/
│
├── app.py
├── config.py
├── requirements.txt
├── README.md
│
├── database/
│   ├── db.py
│   └── schema.sql
│
├── models/
│   ├── user.py
│   ├── menu.py
│   ├── order.py
│   ├── table.py
│   └── payment.py
│
├── routes/
│   ├── auth.py
│   ├── admin.py
│   ├── waiter.py
│   ├── kitchen.py
│   ├── cashier.py
│   └── orders.py
│
├── templates/
│   ├── login.html
│   ├── admin/
│   ├── waiter/
│   ├── kitchen/
│   └── cashier/
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
└── uploads/
    └── menu/
```

*Note: This is a suggested project structure. Actual files may differ depending on your implementation.*

---

## ⚙️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/restaurant-management-system.git
```

### Step 2: Navigate to Project Folder

```bash
cd restaurant-management-system
```

### Step 3: Create Virtual Environment

```bash
python -m venv .venv
```

### Step 4: Activate Virtual Environment

Windows PowerShell:

```bash
.venv\Scripts\Activate.ps1
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Configure Database

Configure your database connection in `config.py` and initialize the database using your schema or migration commands.

### Step 7: Run Application

```bash
python app.py
```

### Step 8: Open in Browser

```text
http://127.0.0.1:5000
```

---

## 🔄 Order Management Workflow

```text
Customer Arrives
       |
       ▼
Waiter Assigns Table
       |
       ▼
Waiter Creates Order
       |
       ▼
Order Sent to Kitchen
       |
       ▼
Chef Receives Order
       |
       ▼
Chef Prepares Food
       |
       ▼
Order Status = READY
       |
       ▼
Waiter Serves Food
       |
       ▼
Cashier Generates Bill
       |
       ▼
Customer Completes Payment
       |
       ▼
Order Completed
```

---

## 🗄️ Main Database Tables

| Table | Purpose |
|---|---|
| users | Stores staff login information |
| roles | Stores user roles and permissions |
| categories | Stores food categories |
| menu_items | Stores food menu details |
| restaurant_tables | Stores restaurant table details |
| orders | Stores customer orders |
| order_items | Stores individual ordered items |
| payments | Stores payment information |
| reservations | Stores table reservations |

---

## 📊 Dashboard Analytics

The Admin Dashboard can display:

- Total Revenue
- Today's Sales
- Total Orders
- Pending Orders
- Completed Orders
- Available Tables
- Most Popular Food Items
- Daily / Weekly / Monthly Sales Reports

---

## 🔐 Security Features

- Secure user authentication.
- Role-based access control.
- Password hashing.
- Input validation.
- Protected admin routes.
- Secure database operations.
- Session management.

---

## 🚀 Future Enhancements

- QR Code-based food ordering.
- Online food ordering system.
- Customer mobile application.
- Inventory and stock management.
- Automatic low-stock alerts.
- Kitchen Display System (KDS).
- AI-based sales forecasting.
- Customer feedback and ratings.
- Online payment gateway integration.
- Multiple restaurant branch management.

---

## 💡 Project Development Phases

| Phase | Development |
|---|---|
| Phase 1 | UI design, branding and login |
| Phase 2 | Authentication and database |
| Phase 3 | Admin dashboard |
| Phase 4 | Table and menu management |
| Phase 5 | Waiter order management |
| Phase 6 | Kitchen dashboard |
| Phase 7 | Cashier and billing |
| Phase 8 | Real-time order synchronization |
| Phase 9 | Testing and deployment |

---

## 👨‍💻 Developer

**Project:** Restaurant Management System

**Category:** Full-Stack Application

**Purpose:** Restaurant Automation and Management

**Version:** 1.0.0

---

## 📄 License

This project is developed for educational and learning purposes. You may modify and extend the application according to your requirements.

---

⭐ **If you find this project useful, consider giving it a star on GitHub!**

