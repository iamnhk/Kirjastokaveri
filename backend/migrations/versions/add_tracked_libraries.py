"""add tracked_libraries column

Revision ID: a1b2c3d4e5f6
Revises: 9e5f45e51a2b
Create Date: 2025-12-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'b4c5d6e7f8g9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tracked_libraries JSON column to user_books table."""
    # Add tracked_libraries column - stores array of library names to track
    op.add_column(
        'user_books',
        sa.Column('tracked_libraries', sa.JSON(), nullable=True)
    )
    
    # Create index for faster lookup of books with tracked libraries
    # Use jsonb_array_length to check for non-empty arrays
    op.create_index(
        'idx_user_books_has_tracked_libs',
        'user_books',
        ['user_id'],
        postgresql_where=sa.text("tracked_libraries IS NOT NULL AND jsonb_array_length(tracked_libraries::jsonb) > 0")
    )
    
    # Migrate existing library_name to tracked_libraries array
    # Only for wishlist items that have a library_name set
    op.execute("""
        UPDATE user_books 
        SET tracked_libraries = json_build_array(library_name)
        WHERE library_name IS NOT NULL 
        AND library_name != ''
        AND list_type = 'wishlist'
    """)


def downgrade() -> None:
    """Remove tracked_libraries column."""
    op.drop_index('idx_user_books_has_tracked_libs', table_name='user_books')
    op.drop_column('user_books', 'tracked_libraries')
