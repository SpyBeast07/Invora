import pytest
from httpx import AsyncClient


# ==============================================================================
# 1. Product Management Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient):
    payload = {
        "sku": "PROD-100",
        "name": "Mechanical Keyboard",
        "price": 89.99,
        "quantity_in_stock": 10,
    }
    response = await client.post("/api/v1/products", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["sku"] == "PROD-100"
    assert data["name"] == "Mechanical Keyboard"
    assert float(data["price"]) == 89.99
    assert data["quantity_in_stock"] == 10
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_duplicate_sku(client: AsyncClient):
    payload = {"sku": "PROD-100", "name": "Keyboard", "price": 89.99, "quantity_in_stock": 5}

    res1 = await client.post("/api/v1/products", json=payload)
    assert res1.status_code == 201

    # Second creation with identical SKU must be rejected
    res2 = await client.post("/api/v1/products", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_product_price_must_be_positive(client: AsyncClient):
    payload = {"sku": "BAD-001", "name": "Bad Product", "price": 0, "quantity_in_stock": 5}
    response = await client.post("/api/v1/products", json=payload)
    assert response.status_code == 422  # Pydantic gt=0 validation


@pytest.mark.asyncio
async def test_product_quantity_cannot_be_negative(client: AsyncClient):
    payload = {"sku": "BAD-002", "name": "Bad Product", "price": 10.00, "quantity_in_stock": -1}
    response = await client.post("/api/v1/products", json=payload)
    assert response.status_code == 422  # Pydantic ge=0 validation


# ==============================================================================
# 2. Customer Management Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient):
    payload = {
        "full_name": "Alice Smith",
        "email": "alice@gmail.com",
        "phone_number": "+1 (123) 456-7890",
    }
    response = await client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["full_name"] == "Alice Smith"
    assert data["email"] == "alice@gmail.com"
    assert data["phone_number"] == "+1 (123) 456-7890"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_duplicate_email(client: AsyncClient):
    payload = {"full_name": "Alice Smith", "email": "alice@gmail.com"}

    res1 = await client.post("/api/v1/customers", json=payload)
    assert res1.status_code == 201

    # Second creation with same email must be rejected
    res2 = await client.post("/api/v1/customers", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


# ==============================================================================
# 3. Order Management & Stock Control Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_create_order_reduces_inventory(client: AsyncClient):
    # 1. Create product with 15 in stock
    prod_res = await client.post(
        "/api/v1/products",
        json={"sku": "IPHONE-15", "name": "iPhone 15", "price": 999.00, "quantity_in_stock": 15},
    )
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]

    # 2. Create customer
    cust_res = await client.post(
        "/api/v1/customers",
        json={"full_name": "Bob Jones", "email": "bob@jones.com"},
    )
    assert cust_res.status_code == 201
    customer_id = cust_res.json()["id"]

    # 3. Place order for 3 units
    order_res = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 3}]},
    )
    assert order_res.status_code == 201

    order_data = order_res.json()
    assert float(order_data["total_amount"]) == 2997.00  # 999.00 * 3
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 3
    assert float(order_data["items"][0]["unit_price"]) == 999.00

    # 4. Stock must reduce from 15 to 12
    verify_res = await client.get(f"/api/v1/products/{product_id}")
    assert verify_res.status_code == 200
    assert verify_res.json()["quantity_in_stock"] == 12


@pytest.mark.asyncio
async def test_insufficient_stock_rejected(client: AsyncClient):
    # Product with only 5 in stock
    prod_res = await client.post(
        "/api/v1/products",
        json={"sku": "IPHONE-15", "name": "iPhone 15", "price": 999.00, "quantity_in_stock": 5},
    )
    product_id = prod_res.json()["id"]

    cust_res = await client.post(
        "/api/v1/customers",
        json={"full_name": "Bob Jones", "email": "bob@jones.com"},
    )
    customer_id = cust_res.json()["id"]

    # Order for 10 units must fail
    order_res = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 10}]},
    )
    assert order_res.status_code == 400
    assert "Insufficient stock" in order_res.json()["detail"]

    # Stock must be unchanged
    verify_res = await client.get(f"/api/v1/products/{product_id}")
    assert verify_res.json()["quantity_in_stock"] == 5


# ==============================================================================
# 4. Dashboard Statistics Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_dashboard_statistics(client: AsyncClient):
    # Seed 2 products (one low stock <= 5)
    await client.post(
        "/api/v1/products",
        json={"sku": "ITEM-A", "name": "Normal Stock", "price": 10.00, "quantity_in_stock": 50},
    )
    await client.post(
        "/api/v1/products",
        json={"sku": "ITEM-B", "name": "Low Stock Item", "price": 20.00, "quantity_in_stock": 2},
    )

    # Seed 1 customer
    await client.post(
        "/api/v1/customers",
        json={"full_name": "Charlie Brown", "email": "charlie@brown.com"},
    )

    dash_res = await client.get("/api/v1/dashboard")
    assert dash_res.status_code == 200

    data = dash_res.json()
    assert data["total_products"] == 2
    assert data["total_customers"] == 1
    assert data["low_stock_products"] == 1  # ITEM-B (qty=2, threshold <=5)
    assert data["total_orders"] == 0
