# Database Migrations

This directory houses Alembic migrations and supporting assets.

## Common commands

```bash
# Create a new migration after updating SQLAlchemy models
alembic revision --autogenerate -m "describe change"

# Apply all pending migrations
alembic upgrade head

# Roll back the most recent migration
alembic downgrade -1
```

All commands should be executed from the `backend/` directory with the appropriate Python environment activated.

## Metadata source

Alembic reads SQLAlchemy metadata from `app.db.Base`. Add new models to the application and ensure they inherit from `Base` so autogenerate can detect schema changes.

## Database URL

The migration environment pulls its database URL from application settings (`Settings.database_url`). Override values in `.env` if you need to target a different database.
