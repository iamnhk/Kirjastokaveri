"""create unified user_books table

Revision ID: b4c5d6e7f8g9
Revises: a3b2c1d4e5f6
Create Date: 2025-12-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b4c5d6e7f8g9'
down_revision: Union[str, None] = 'a3b2c1d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get connection for checking if enums exist
    connection = op.get_bind()
    
    # Check if listtype enum already exists
    result = connection.execute(sa.text(
        "SELECT 1 FROM pg_type WHERE typname = 'listtype'"
    )).fetchone()
    
    if not result:
        # Create list_type enum only if it doesn't exist
        connection.execute(sa.text(
            "CREATE TYPE listtype AS ENUM ('wishlist', 'reading', 'completed', 'reserved')"
        ))
    
    # Check if reservationstatus_v2 enum already exists
    result = connection.execute(sa.text(
        "SELECT 1 FROM pg_type WHERE typname = 'reservationstatus_v2'"
    )).fetchone()
    
    if not result:
        # Create reservation_status enum only if it doesn't exist
        connection.execute(sa.text(
            "CREATE TYPE reservationstatus_v2 AS ENUM ('pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'cancelled', 'returned')"
        ))

    # Create user_books table using raw PostgreSQL ENUM types (won't auto-create)
    listtype_enum = postgresql.ENUM('wishlist', 'reading', 'completed', 'reserved', name='listtype', create_type=False)
    status_enum = postgresql.ENUM('pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'cancelled', 'returned', name='reservationstatus_v2', create_type=False)
    
    op.create_table(
        'user_books',
        # Primary key and foreign key
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        # List type - use existing PostgreSQL enum
        sa.Column('list_type', listtype_enum, nullable=False),
        
        # Core book information
        sa.Column('finna_id', sa.String(255), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('author', sa.String(300), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('year', sa.String(20), nullable=True),
        sa.Column('isbn', sa.String(100), nullable=True),
        
        # Library information
        sa.Column('library_id', sa.String(100), nullable=True),
        sa.Column('library_name', sa.String(200), nullable=True),
        
        # Dates
        sa.Column('start_date', sa.String(30), nullable=True),
        sa.Column('due_date', sa.String(30), nullable=True),
        sa.Column('completed_date', sa.String(30), nullable=True),
        sa.Column('reservation_date', sa.String(30), nullable=True),
        sa.Column('pickup_date', sa.String(30), nullable=True),
        sa.Column('pickup_deadline', sa.String(30), nullable=True),
        sa.Column('return_date', sa.String(30), nullable=True),
        
        # Reading progress
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        
        # Rating (completed)
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review', sa.Text(), nullable=True),
        
        # Reservation status - use existing PostgreSQL enum
        sa.Column('status', status_enum, nullable=True),
        sa.Column('queue_position', sa.Integer(), nullable=True),
        sa.Column('estimated_wait_days', sa.Integer(), nullable=True),
        sa.Column('reservation_number', sa.String(100), nullable=True),
        
        # Wishlist notifications
        sa.Column('notify_on_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_availability_check', sa.String(30), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('availability_data', sa.JSON(), nullable=True),
        
        # Notes
        sa.Column('user_notes', sa.Text(), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        
        # Constraints
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_user_books_id'), 'user_books', ['id'], unique=False)
    op.create_index(op.f('ix_user_books_user_id'), 'user_books', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_books_finna_id'), 'user_books', ['finna_id'], unique=False)
    op.create_index(op.f('ix_user_books_list_type'), 'user_books', ['list_type'], unique=False)
    op.create_index('idx_user_books_user_list', 'user_books', ['user_id', 'list_type'], unique=False)
    op.create_index('idx_user_books_user_finna', 'user_books', ['user_id', 'finna_id'], unique=False)
    
    # Migrate data from existing tables
    # 1. Migrate wishlist_items
    op.execute("""
        INSERT INTO user_books (
            user_id, list_type, finna_id, title, author, cover_image, year, isbn,
            library_id, library_name, notify_on_available, last_availability_check,
            is_available, availability_data, user_notes, created_at, updated_at
        )
        SELECT 
            user_id, 'wishlist', finna_id, title, author, cover_image, year, isbn,
            preferred_library_id, preferred_library_name, notify_on_available, last_availability_check,
            is_available, availability_data, user_notes, created_at, updated_at
        FROM wishlist_items
    """)
    
    # 2. Migrate reading_items
    op.execute("""
        INSERT INTO user_books (
            user_id, list_type, finna_id, title, author, cover_image,
            library_id, library_name, start_date, due_date, progress,
            user_notes, created_at, updated_at
        )
        SELECT 
            user_id, 'reading', COALESCE(finna_id, 'manual_' || id::text), title, author, cover_image,
            library_id, library_name, start_date, due_date, progress,
            user_notes, created_at, updated_at
        FROM reading_items
    """)
    
    # 3. Migrate completed_items
    op.execute("""
        INSERT INTO user_books (
            user_id, list_type, finna_id, title, author, cover_image,
            start_date, completed_date, progress, rating, review,
            user_notes, created_at, updated_at
        )
        SELECT 
            user_id, 'completed', COALESCE(finna_id, 'manual_' || id::text), title, author, cover_image,
            start_date, completed_date, 100, rating, review,
            user_notes, created_at, updated_at
        FROM completed_items
    """)
    
    # 4. Migrate reservations (status mapping)
    op.execute("""
        INSERT INTO user_books (
            user_id, list_type, finna_id, title, author, cover_image,
            library_id, library_name, reservation_date, pickup_date, pickup_deadline,
            due_date, return_date, status, queue_position, estimated_wait_days,
            reservation_number, user_notes, created_at, updated_at
        )
        SELECT 
            user_id, 'reserved', finna_id, title, author, cover_image,
            library_id, library_name, reservation_date, pickup_date, pickup_deadline,
            due_date, return_date, 
            CASE status::text
                WHEN 'PENDING' THEN 'pending'
                WHEN 'CONFIRMED' THEN 'confirmed'
                WHEN 'READY_FOR_PICKUP' THEN 'ready_for_pickup'
                WHEN 'PICKED_UP' THEN 'picked_up'
                WHEN 'CANCELLED' THEN 'cancelled'
                WHEN 'RETURNED' THEN 'returned'
                ELSE 'pending'
            END::reservationstatus_v2,
            queue_position, estimated_wait_days,
            reservation_number, user_notes, created_at, updated_at
        FROM reservations
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_user_books_user_finna', table_name='user_books')
    op.drop_index('idx_user_books_user_list', table_name='user_books')
    op.drop_index(op.f('ix_user_books_list_type'), table_name='user_books')
    op.drop_index(op.f('ix_user_books_finna_id'), table_name='user_books')
    op.drop_index(op.f('ix_user_books_user_id'), table_name='user_books')
    op.drop_index(op.f('ix_user_books_id'), table_name='user_books')
    
    # Drop table
    op.drop_table('user_books')
    
    # Drop enums
    sa.Enum(name='reservationstatus_v2').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='listtype').drop(op.get_bind(), checkfirst=True)
