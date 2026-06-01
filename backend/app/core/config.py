import json
from typing import Any, List, Union
from pydantic import AnyHttpUrl, BeforeValidator, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Invora"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # PostgreSQL Database Connections
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "invora"
    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str | None, values: Any) -> Any:
        if isinstance(v, str) and v:
            return v
        
        # If database URL isn't explicitly provided, compile it from credentials
        user = values.data.get("POSTGRES_USER")
        password = values.data.get("POSTGRES_PASSWORD")
        server = values.data.get("POSTGRES_SERVER")
        port = values.data.get("POSTGRES_PORT")
        db = values.data.get("POSTGRES_DB")
        
        return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"

    # For alembic and sync utilities, we need a sync database URL option
    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            # Swap asyncpg with psycopg2 driver if necessary
            return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # CORS Origins list
    # Accepts JSON arrays like '["http://localhost:5173", "http://localhost:3000"]' or comma-separated strings
    BACKEND_CORS_ORIGINS: Annotated[
        List[str],
        BeforeValidator(lambda v: json.loads(v) if isinstance(v, str) and v.startswith("[") else [i.strip() for i in v.split(",")] if isinstance(v, str) else v)
    ] = []


settings = Settings()
