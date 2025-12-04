"""drop legacy tables after unified user_books migration

Revision ID: c5d6e7f8g9h0
Revises: a1b2c3d4e5f6
Create Date: 2025-01-18 12:00:00.000000

This migration drops the legacy tables that were replaced by the unified
user_books table. All data was migrated in the b4c5d6e7f8g9 migration.

Tables dropped:
- wishlist_items (data migrated to user_books with list_type='wishlist')
- reading_items (data migrated to user_books with list_type='reading')
- completed_items (data migrated to user_books with list_type='completed')
- reservations (data migrated to user_books with list_type='reserved')

Enums dropped:
- reservationstatus (replaced by reservationstatus_v2 in user_books)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d6e7f8g9h0'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop legacy tables that have been replaced by user_books."""
    
    # Use raw SQL with IF EXISTS for safe dropping
    connection = op.get_bind()
    
    # 1. Drop wishlist_items
    connection.execute(sa.text('DROP TABLE IF EXISTS wishlist_items CASCADE'))
    
    # 2. Drop reading_items
    connection.execute(sa.text('DROP TABLE IF EXISTS reading_items CASCADE'))
    
    # 3. Drop completed_items
    connection.execute(sa.text('DROP TABLE IF EXISTS completed_items CASCADE'))
    
    # 4. Drop reservations
    connection.execute(sa.text('DROP TABLE IF EXISTS reservations CASCADE'))
    
    # 5. Drop legacy enum type (replaced by reservationstatus_v2)
    connection.execute(sa.text('DROP TYPE IF EXISTS reservationstatus'))


def downgrade() -> None:
    """
    Recreate legacy tables.
    
    WARNING: This will create empty tables. Data cannot be automatically 
    restored from user_books without manual intervention.
    """
    # Recreate reservationstatus enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE reservationstatus AS ENUM (
                'PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 
                'PICKED_UP', 'CANCELLED', 'RETURNED'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Recreate wishlist_items table
    op.create_table(
        'wishlist_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('finna_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('author', sa.String(length=300), nullable=True),
        sa.Column('year', sa.String(length=20), nullable=True),
        sa.Column('isbn', sa.String(length=100), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('notify_on_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('preferred_library_id', sa.String(length=100), nullable=True),
        sa.Column('preferred_library_name', sa.String(length=200), nullable=True),
        sa.Column('last_availability_check', sa.String(length=30), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('availability_data', sa.JSON(), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wishlist_items_finna_id'), 'wishlist_items', ['finna_id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_id'), 'wishlist_items', ['id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_user_id'), 'wishlist_items', ['user_id'], unique=False)
    
    # Recreate reading_items table
    op.create_table(
        'reading_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('finna_id', sa.String(255), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('author', sa.String(300), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('library_id', sa.String(100), nullable=True),
        sa.Column('library_name', sa.String(200), nullable=True),
        sa.Column('due_date', sa.String(30), nullable=True),
        sa.Column('start_date', sa.String(30), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reading_items_id'), 'reading_items', ['id'], unique=False)
    op.create_index(op.f('ix_reading_items_user_id'), 'reading_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_reading_items_finna_id'), 'reading_items', ['finna_id'], unique=False)
    
    # Recreate completed_items table
    op.create_table(
        'completed_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('finna_id', sa.String(255), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('author', sa.String(300), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('completed_date', sa.String(30), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.String(30), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('review', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_completed_items_id'), 'completed_items', ['id'], unique=False)
    op.create_index(op.f('ix_completed_items_user_id'), 'completed_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_completed_items_finna_id'), 'completed_items', ['finna_id'], unique=False)
    
    # Recreate reservations table
    op.create_table(
        'reservations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('finna_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('author', sa.String(length=300), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('library_id', sa.String(length=100), nullable=False),
        sa.Column('library_name', sa.String(length=200), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'RETURNED', name='reservationstatus', create_type=False), nullable=False),
        sa.Column('reservation_date', sa.String(length=30), nullable=True),
        sa.Column('pickup_date', sa.String(length=30), nullable=True),
        sa.Column('pickup_deadline', sa.String(length=30), nullable=True),
        sa.Column('due_date', sa.String(length=30), nullable=True),
        sa.Column('return_date', sa.String(length=30), nullable=True),
        sa.Column('queue_position', sa.Integer(), nullable=True),
        sa.Column('estimated_wait_days', sa.Integer(), nullable=True),
        sa.Column('reservation_number', sa.String(length=100), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reservations_finna_id'), 'reservations', ['finna_id'], unique=False)
    op.create_index(op.f('ix_reservations_id'), 'reservations', ['id'], unique=False)
    op.create_index(op.f('ix_reservations_library_id'), 'reservations', ['library_id'], unique=False)
    op.create_index(op.f('ix_reservations_status'), 'reservations', ['status'], unique=False)
    op.create_index(op.f('ix_reservations_user_id'), 'reservations', ['user_id'], unique=False)
