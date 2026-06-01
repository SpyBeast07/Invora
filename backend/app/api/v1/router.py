from fastapi import APIRouter

from app.api.v1.endpoints import products, customers, orders, dashboard, health

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
