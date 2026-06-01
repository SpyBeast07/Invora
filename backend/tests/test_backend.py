import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import get_password_hash
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer


# Helper function to register an admin and return auth headers
def get_auth_headers(client: TestClient) -> dict:
    # 1. Signup staff
    signup_payload = {
        "email": "admin@invora.com",
        "full_name": "Admin Operator",
        "role": "admin",
        "password": "securepassword123"
    }
    client.post("/api/v1/auth/signup", json=signup_payload)

    # 2. Login to retrieve access token
    login_payload = {
        "username": "admin@invora.com",
        "password": "securepassword123"
    }
    response = client.post("/api/v1/auth/login", data=login_payload)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Product Management Tests
# ==============================================================================

def test_create_product(client: TestClient):
    headers = get_auth_headers(client)
    
    payload = {
        "sku": "PROD-100",
        "name": "Mechanical Keyboard",
        "description": "RGB backlight brown switches keyboard",
        "category": "Electronics",
        "price": 89.99,
        "quantity_in_stock": 10,
        "is_active": True
    }
    response = client.post("/api/v1/products", json=payload, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["sku"] == "PROD-100"
    assert data["name"] == "Mechanical Keyboard"
    assert float(data["price"]) == 89.99
    assert data["quantity_in_stock"] == 10
    assert "id" in data


def test_create_duplicate_sku(client: TestClient):
    headers = get_auth_headers(client)
    
    payload = {
        "sku": "PROD-100",
        "name": "Keyboard",
        "price": 89.99,
        "quantity_in_stock": 5
    }
    
    # First creation succeeds
    res1 = client.post("/api/v1/products", json=payload, headers=headers)
    assert res1.status_code == 201
    
    # Second creation with identical SKU should be rejected (400 Bad Request)
    res2 = client.post("/api/v1/products", json=payload, headers=headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


# ==============================================================================
# 2. Customer Management Tests
# ==============================================================================

def test_create_customer(client: TestClient):
    headers = get_auth_headers(client)
    
    payload = {
        "full_name": "Alice Smith",
        "email": "alice@gmail.com",
        "phone_number": "+1 (123) 456-7890"
    }
    response = client.post("/api/v1/customers", json=payload, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["full_name"] == "Alice Smith"
    assert data["email"] == "alice@gmail.com"
    assert data["phone_number"] == "+1 (123) 456-7890"
    assert "id" in data


def test_create_duplicate_email(client: TestClient):
    headers = get_auth_headers(client)
    
    payload = {
        "full_name": "Alice Smith",
        "email": "alice@gmail.com"
    }
    
    # First creation succeeds
    res1 = client.post("/api/v1/customers", json=payload, headers=headers)
    assert res1.status_code == 201
    
    # Second creation with same email fails
    res2 = client.post("/api/v1/customers", json=payload, headers=headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


# ==============================================================================
# 3. Order Management & Stock Control Tests
# ==============================================================================

def test_create_order_and_reduces_inventory(client: TestClient):
    headers = get_auth_headers(client)
    
    # 1. Seed a product with 15 stock
    prod_res = client.post(
        "/api/v1/products", 
        json={"sku": "IPHONE-15", "name": "iPhone 15", "price": 999.00, "quantity_in_stock": 15},
        headers=headers
    )
    product_id = prod_res.json()["id"]
    
    # 2. Seed a customer
    cust_res = client.post(
        "/api/v1/customers", 
        json={"full_name": "Bob Jones", "email": "bob@jones.com"},
        headers=headers
    )
    customer_id = cust_res.json()["id"]
    
    # 3. Place order for 3 items
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "quantity": 3}
        ]
    }
    order_res = client.post("/api/v1/orders", json=order_payload, headers=headers)
    assert order_res.status_code == 201
    
    order_data = order_res.json()
    assert order_data["status"] == "pending"
    assert float(order_data["total_amount"]) == 2997.00  # 999.00 * 3
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 3
    assert float(order_data["items"][0]["unit_price"]) == 999.00  # Stored price snapshot!
    
    # 4. Verify stock count reduces from 15 to 12
    verify_res = client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["quantity_in_stock"] == 12


def test_insufficient_stock_rejections(client: TestClient):
    headers = get_auth_headers(client)
    
    # Seed a product with 5 stock
    prod_res = client.post(
        "/api/v1/products", 
        json={"sku": "IPHONE-15", "name": "iPhone 15", "price": 999.00, "quantity_in_stock": 5},
        headers=headers
    )
    product_id = prod_res.json()["id"]
    
    # Seed a customer
    cust_res = client.post(
        "/api/v1/customers", 
        json={"full_name": "Bob Jones", "email": "bob@jones.com"},
        headers=headers
    )
    customer_id = cust_res.json()["id"]
    
    # Attempt to place order for 10 items (only 5 in stock)
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "quantity": 10}
        ]
    }
    order_res = client.post("/api/v1/orders", json=order_payload, headers=headers)
    assert order_res.status_code == 400
    assert "Insufficient stock" in order_res.json()["detail"]
    
    # Verify inventory is not modified (remains 5)
    verify_res = client.get(f"/api/v1/products/{product_id}", headers=headers)
    assert verify_res.json()["quantity_in_stock"] == 5


# ==============================================================================
# 4. Dashboard Statistics Tests
# ==============================================================================

def test_dashboard_statistics(client: TestClient):
    headers = get_auth_headers(client)
    
    # 1. Seed 2 products (1 normal stock, 1 low stock)
    client.post(
        "/api/v1/products", 
        json={"sku": "ITEM-A", "name": "Normal Stock", "price": 10.00, "quantity_in_stock": 50},
        headers=headers
    )
    client.post(
        "/api/v1/products", 
        json={"sku": "ITEM-B", "name": "Low Stock", "price": 20.00, "quantity_in_stock": 2},
        headers=headers
    )
    
    # 2. Seed 1 Customer
    client.post(
        "/api/v1/customers", 
        json={"full_name": "Charlie Brown", "email": "charlie@brown.com"},
        headers=headers
    )
    
    # 3. Check Dashboard statistics
    dash_res = client.get("/api/v1/dashboard", headers=headers)
    assert dash_res.status_code == 200
    
    dash_data = dash_res.json()
    assert dash_data["total_products"] == 2
    assert dash_data["total_customers"] == 1
    assert dash_data["low_stock_products"] == 1  # ITEM-B stock is 2 (<= 5)
    assert dash_data["total_orders"] == 0
