from fastapi import APIRouter

router = APIRouter()


@router.get("", status_code=200)
async def health_check():
    """Simple health check endpoint. Returns {"status": "healthy"}."""
    return {"status": "healthy"}
