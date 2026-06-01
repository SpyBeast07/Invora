# Invora 📦💼

Invora is a production-ready, highly optimized **Inventory & Order Management Platform** designed for store operators, warehouse managers, and administrators. 

The backend is built using a modern, clean architecture in **FastAPI**, backed by **SQLAlchemy 2.0** and **PostgreSQL**, with automated migrations via **Alembic**, a local containerized database environment via **Docker**, and a comprehensive test suite via **Pytest**.

---

## 🚀 Key Features

*   **Secure Authentication & RBAC**: OAuth2 form login with JWT bearer tokens. Implements secure Role-Based Access Control (Admins, Managers, Operators) protecting sensitive endpoints.
*   **Normalized Database Schema**: Decoupled models mapping products, custom stock allocations, orders, order items, and user accounts.
*   **ACID Transaction Checkout**: Order processing automatically validates stock availability, freezes product pricing snapshot in order lines, decrements inventory stock, and handles clean database rollbacks upon failures.
*   **Auto Inventory Safeguards**: Prevents negative stock levels, rejects invalid parameters, and automatically restores stock allocations back to the catalog if orders are cancelled or deleted.
*   **Single-Query Dashboard Analytics**: Highly optimized database analytics metrics select aggregate counts and stock alerts in a single database round-trip.
*   **Fully Asynchronous Operations**: Modern FastAPI controller layer utilizing SQLAlchemy async drivers (`asyncpg`) and async database engines.
*   **Automated Migrations**: Complete migration history and model auto-discovery using Alembic.
*   **High Test Coverage**: Transactional, isolated SQLite memory test suite (`pytest` + `pytest-asyncio` + `aiosqlite`).

---

## 🛠️ Technology Stack

*   **Language**: Python 3.12+ (fully compatible up to Python 3.14)
*   **Web Framework**: FastAPI
*   **Asynchronous Web Server**: Uvicorn
*   **Object-Relational Mapping (ORM)**: SQLAlchemy 2.0 (Asyncio)
*   **Database Driver**: Asyncpg & Psycopg2-binary
*   **Migrations Engine**: Alembic
*   **Data Validation**: Pydantic v2
*   **Configuration Manager**: Pydantic-Settings v2
*   **Security & Hashing**: Passlib (Bcrypt) & Python-Jose
*   **Containers**: Docker & Docker Compose
*   **Database Engine**: PostgreSQL 16
*   **Test Suite**: Pytest, Pytest-Asyncio, Aiosqlite, HTTPX

---

## 📂 Project Structure

```
Invora/
├── backend/                     # Python FastAPI Backend Services
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py          # Logins, JWT tokens, & Signup
│   │   │   │   │   ├── customers.py     # Customer management CRUD
│   │   │   │   │   ├── dashboard.py     # Optimized metrics round-trip
│   │   │   │   │   ├── health.py        # Database active check ping
│   │   │   │   │   └── products.py      # Catalog management CRUD
│   │   │   │   └── router.py            # Global mount registry
│   │   │   └── deps.py                  # auth, DB connection, & RBAC dependencies
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic v2 validation settings & CORS
│   │   │   ├── database.py              # SQLAlchemy async pooling
│   │   │   └── security.py              # bcrypt password hashes & JWT signing
│   │   ├── models/
│   │   │   ├── __init__.py              # Unified exports for Alembic
│   │   │   ├── base.py                  # Audit timestamps declarative base
│   │   │   ├── customer.py              # Customer table schema
│   │   │   ├── order.py                 # Order & OrderItem table schemas
│   │   │   ├── product.py               # Product with direct stock schema
│   │   │   └── user.py                  # Operational auth accounts schema
│   │   ├── schemas/
│   │   │   ├── common.py                # Paginations & envelopes
│   │   │   ├── customer.py              # Customer Pydantic validation
│   │   │   ├── dashboard.py             # Analytics Pydantic models
│   │   │   ├── order.py                 # Checkout & order lines validation
│   │   │   └── product.py               # Price (gt=0) & SKU uniqueness validation
│   │   ├── services/
│   │   │   ├── auth.py                  # Logins & signup operations
│   │   │   ├── customer.py              # Customer management validations
│   │   │   ├── dashboard.py             # Analytics aggregation logic
│   │   │   ├── order.py                 # ACID transaction checkout processor
│   │   │   └── product.py               # Catalog management validations
│   │   └── main.py                      # Global entrypoint & CORS middlewares
│   ├── alembic/                         # Alembic database migrations history
│   ├── tests/                           # Complete test suite
│   │   ├── conftest.py                  # Transactional aiosqlite isolated fixtures
│   │   └── test_backend.py              # End-to-end endpoint tests
│   ├── .env.example                     # Environment template
│   ├── .env                             # Local config secrets
│   ├── .gitignore                       # Clean Git exclude patterns
│   ├── alembic.ini                      # Alembic CLI config
│   ├── docker-compose.yml               # Local PostgreSQL service
│   ├── Dockerfile                       # Production multi-stage build
│   ├── pytest.ini                       # Pytest-asyncio configuration
│   └── requirements.txt                 # Dependencies package list
└── frontend/                    # Vite Frontend Application
```

---

## 🐳 Database Docker Environment

Start a persistent PostgreSQL 16 database locally in the background using Docker Compose:

```bash
cd backend
docker compose up -d
```

*   Binds port `5432` to your localhost.
*   Data is safely persisted inside the named volume `invora_postgres_data`.
*   Includes built-in database `healthcheck`.

---

## 🏃 Local Setup & Run Instructions

### 1. Configure the Virtual Environment
Navigate to the `backend/` folder, create a virtual environment, activate it, and install dependencies:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Database Migrations
Initialize your database schema by applying migrations using Alembic:

```bash
alembic upgrade head
```

*(To generate a new migration after modifying models in the future, simply run: `alembic revision --autogenerate -m "revision_description"`)*.

### 3. Launch the Server
Launch the FastAPI reload server:

```bash
uvicorn app.main:app --reload
```

*   **Interactive Swagger Documentation**: `http://localhost:8000/docs`
*   **ReDoc Documentation**: `http://localhost:8000/redoc`
*   **System Health Check Ping**: `http://localhost:8000/api/v1/health`

---

## 🧪 Testing Suite

Tests run against an **isolated in-memory SQLite database (`aiosqlite`)**, creating and tearing down all tables automatically for every test case.

To run the complete test suite:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```
