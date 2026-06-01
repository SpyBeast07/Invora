from pydantic import BaseModel, Field


class DashboardResponse(BaseModel):
    total_products: int = Field(..., description="Total products registered in the catalog")
    total_customers: int = Field(..., description="Total customer profiles registered")
    total_orders: int = Field(..., description="Total sales orders processed")
    low_stock_products: int = Field(..., description="Number of products whose stock is low (<= 5 items)")
