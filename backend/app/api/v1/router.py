from fastapi import APIRouter

from app.api.v1.endpoints import auth, products, inventory, orders, health

api_router = APIRouter()

# Mount all endpoint routers under v1
api_router.include_router(health.router, prefix="/health", tags=["Health Check"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
