import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.database import Base

# ---------------------------------------------------------
# Import all SQLAlchemy models
#
# IMPORTANT:
# Alembic needs every model imported here so that all tables
# are registered in Base.metadata before autogeneration.
# ---------------------------------------------------------

from app.models.user import User
from app.models.salon import Salon
from app.models.service import Service
from app.models.service_category import ServiceCategory


# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------

load_dotenv()


# ---------------------------------------------------------
# Alembic configuration
# ---------------------------------------------------------

config = context.config


# ---------------------------------------------------------
# Get DATABASE_URL from .env
# ---------------------------------------------------------

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL is not set in the .env file"
    )


# ---------------------------------------------------------
# IMPORTANT:
# Alembic uses ConfigParser.
#
# ConfigParser treats "%" as interpolation syntax.
#
# Example:
# %40 -> %
#
# Therefore, escape "%" as "%%" before giving
# the URL to Alembic.
# ---------------------------------------------------------

config.set_main_option(
    "sqlalchemy.url",
    database_url.replace("%", "%%")
)


# ---------------------------------------------------------
# Configure logging
# ---------------------------------------------------------

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ---------------------------------------------------------
# SQLAlchemy metadata
#
# Alembic uses this metadata to detect changes
# in our SQLAlchemy models.
# ---------------------------------------------------------

target_metadata = Base.metadata


# ---------------------------------------------------------
# OFFLINE MIGRATIONS
# ---------------------------------------------------------

def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.

    Alembic generates SQL without creating
    an actual database connection.
    """

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# ONLINE MIGRATIONS
# ---------------------------------------------------------

def run_migrations_online() -> None:
    """
    Run migrations in online mode.

    Alembic connects directly to PostgreSQL
    and applies the migrations.
    """

    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------
# Run migration
# ---------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()