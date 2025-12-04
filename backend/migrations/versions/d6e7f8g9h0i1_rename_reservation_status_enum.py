"""rename reservationstatus_v2 to reservationstatus

Revision ID: d6e7f8g9h0i1
Revises: c5d6e7f8g9h0
Create Date: 2025-12-04 12:00:00.000000

Now that the legacy reservationstatus enum has been dropped,
we can rename reservationstatus_v2 to the cleaner name reservationstatus.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6e7f8g9h0i1'
down_revision: Union[str, None] = 'c5d6e7f8g9h0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename reservationstatus_v2 to reservationstatus."""
    op.execute('ALTER TYPE reservationstatus_v2 RENAME TO reservationstatus')


def downgrade() -> None:
    """Rename back to reservationstatus_v2."""
    op.execute('ALTER TYPE reservationstatus RENAME TO reservationstatus_v2')
