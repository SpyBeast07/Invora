# Invora 📦💼

Invora is a production-ready, highly optimized **Inventory & Order Management Platform** designed for store operators, warehouse managers, and administrators.

The entire application is fully **Dockerized** — backend (FastAPI + PostgreSQL), frontend (React), and reverse proxy (Caddy) all run under a single `docker compose up` command. It is hosted at **[invora.kushagragupta.co.in](https://invora.kushagragupta.co.in)**.

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
├── .env                          # Environment variables (all services)
├── docker-compose.yml            # Orchestrates all 4 services
├── Caddyfile                     # Reverse proxy (routes /api/* to backend)
├── backend/                      # Python FastAPI Backend Services
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
│   │   ├── seed.py                      # Database seed script
│   │   └── main.py                      # Global entrypoint & CORS middlewares
│   ├── alembic/                         # Alembic database migrations history
│   ├── tests/                           # Complete test suite
│   │   ├── conftest.py                  # Transactional aiosqlite isolated fixtures
│   │   └── test_backend.py              # End-to-end endpoint tests
│   ├── .env.example                     # Environment template
│   ├── .env                             # Local config secrets
│   ├── alembic.ini                      # Alembic CLI config
│   ├── Dockerfile                       # Production multi-stage build
│   ├── pytest.ini                       # Pytest-asyncio configuration
│   └── requirements.txt                 # Dependencies package list
├── frontend/                    # Vite + React Frontend Application
│   ├── Dockerfile                       # Multi-stage build (Caddy server)
│   └── Caddyfile                        # SPA routing config
```

---

## 🚀 Live Demo

The application is deployed and accessible at:

> **https://invora.kushagragupta.co.in**

---

## 🐳 Docker Setup (Local Development)

Run the entire application stack (PostgreSQL + Backend + Frontend + Caddy) with a single command:

```bash
docker compose up -d
```

This starts 4 services:

| Service   | Container        | Role                                      |
|-----------|------------------|-------------------------------------------|
| `db`      | `invora_db`      | PostgreSQL 16 database                    |
| `backend` | `invora_backend` | FastAPI / Uvicorn application server      |
| `frontend`| `invora_frontend`| React static files served by Caddy        |
| `caddy`   | `invora_caddy`   | Reverse proxy (routes `/api/*` to backend)|

The app is available at **http://localhost:8087**.

### Run Migrations

After starting the stack, apply database migrations:

```bash
docker compose exec backend alembic upgrade head
```

*(To generate a new migration after modifying models: `docker compose exec backend alembic revision --autogenerate -m "description"`)*.

### Seed the Database (Optional)

Populate with sample products, customers, and orders:

```bash
docker compose exec backend python -m app.seed
```

*Rerunning is safe — it skips seeding if data already exists.*

### View Logs

```bash
docker compose logs -f
```

### Stop the Stack

```bash
docker compose down
```

To also delete the persistent database volume:

```bash
docker compose down -v
```

---

## 🧪 Testing Suite

Tests run against an **isolated in-memory SQLite database (`aiosqlite`)**, creating and tearing down all tables automatically for every test case.

To run the complete test suite:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest -v
```
