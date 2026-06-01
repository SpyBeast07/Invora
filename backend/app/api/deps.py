from app.core.database import get_db

# Re-export get_db so endpoint files can import from a single place
__all__ = ["get_db"]
