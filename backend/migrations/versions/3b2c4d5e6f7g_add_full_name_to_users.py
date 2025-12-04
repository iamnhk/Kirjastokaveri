"""Add full_name column to users table

Revision ID: 3b2c4d5e6f7g
Revises: 2a1b3c4d5e6f
Create Date: 2025-12-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b2c4d5e6f7g'
down_revision: Union[str, Sequence[str], None] = '2a1b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add full_name column to users table."""
    op.add_column('users', sa.Column('full_name', sa.String(length=200), nullable=True))


def downgrade() -> None:
    """Remove full_name column from users table."""
    op.drop_column('users', 'full_name')
