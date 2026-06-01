from fastapi import APIRouter

from app.api.v1.endpoints import auth, products, orders, health, customers, dashboard

api_router = APIRouter()

# Mount all endpoint routers under v1
api_router.include_router(health.router, prefix="/health", tags=["Health Check"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
