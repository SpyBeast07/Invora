import sys
from logging.config import fileConfig
from sqlalchemy import create_engine
from alembic import context

# 1. Add app directory to sys.path to resolve imports cleanly
sys.path.insert(0, ".")

from app.models.base import Base
from app.models import Customer, Product, Order, OrderItem  # noqa: F401 — needed for autogenerate
from app.core.config import settings

# 2. Setup logging config from alembic.ini
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Provide target metadata for autogenerate features
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.SYNC_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using a synchronous engine."""
    # Use sync driver URL for Alembic migrations execution
    sync_url = settings.SYNC_DATABASE_URL
    
    connectable = create_engine(
        sync_url,
        pool_pre_ping=True,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
