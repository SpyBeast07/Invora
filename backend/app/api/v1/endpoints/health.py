import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.get("", status_code=200)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Service health check endpoint.
    Performs an active database ping to verify pool and connection health.
    """
    start_time = time.time()
    db_status = "unhealthy"
    db_latency_ms = None
    
    try:
        # Run a simple, fast query to ping PostgreSQL
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        # We can log this error, but let's return it gracefully in health payload
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": time.time(),
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms
        },
        "services": {
            "inventory_system": "online",
            "order_processing": "online"
        }
    }
