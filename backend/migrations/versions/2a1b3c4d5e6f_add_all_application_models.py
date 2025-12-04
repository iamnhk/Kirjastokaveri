"""Add all application models

Revision ID: 2a1b3c4d5e6f
Revises: 9e5f45e51a2b
Create Date: 2025-06-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a1b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '9e5f45e51a2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all application tables."""
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Libraries table
    op.create_table(
        'libraries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('library_system', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('external_id', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('homepage', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_libraries_city'), 'libraries', ['city'], unique=False)
    op.create_index(op.f('ix_libraries_id'), 'libraries', ['id'], unique=False)
    op.create_index(op.f('ix_libraries_name'), 'libraries', ['name'], unique=True)
    op.create_index(op.f('ix_libraries_library_system'), 'libraries', ['library_system'], unique=False)
    op.create_index(op.f('ix_libraries_external_id'), 'libraries', ['external_id'], unique=True)
    op.create_index('idx_library_coordinates', 'libraries', ['latitude', 'longitude'], unique=False)
    op.create_index('idx_library_city_active', 'libraries', ['city', 'is_active'], unique=False)

    # Wishlist items table
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
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_wishlist_items_finna_id'), 'wishlist_items', ['finna_id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_id'), 'wishlist_items', ['id'], unique=False)
    op.create_index(op.f('ix_wishlist_items_user_id'), 'wishlist_items', ['user_id'], unique=False)

    # Reservations table
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
        sa.Column('status', sa.Enum('PENDING', 'CONFIRMED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED', 'RETURNED', name='reservationstatus'), nullable=False),
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
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reservations_finna_id'), 'reservations', ['finna_id'], unique=False)
    op.create_index(op.f('ix_reservations_id'), 'reservations', ['id'], unique=False)
    op.create_index(op.f('ix_reservations_library_id'), 'reservations', ['library_id'], unique=False)
    op.create_index(op.f('ix_reservations_status'), 'reservations', ['status'], unique=False)
    op.create_index(op.f('ix_reservations_user_id'), 'reservations', ['user_id'], unique=False)

    # Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.Enum('BOOK_AVAILABLE', 'RESERVATION_CONFIRMED', 'READY_FOR_PICKUP', 'PICKUP_DEADLINE_APPROACHING', 'RESERVATION_CANCELLED', 'BOOK_PICKED_UP', 'DUE_DATE_REMINDER', 'OVERDUE', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('book_title', sa.String(length=500), nullable=True),
        sa.Column('library_name', sa.String(length=200), nullable=True),
        sa.Column('finna_id', sa.String(length=255), nullable=True),
        sa.Column('reservation_id', sa.Integer(), nullable=True),
        sa.Column('sent_at', sa.String(length=30), nullable=False),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.String(length=30), nullable=True),
        sa.Column('action_taken', sa.String(length=100), nullable=True),
        sa.Column('delivery_method', sa.String(length=50), nullable=False, server_default='browser'),
        sa.Column('delivery_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_finna_id'), 'notifications', ['finna_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)


def downgrade() -> None:
    """Drop all application tables."""
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_finna_id'), table_name='notifications')
    op.drop_table('notifications')
    
    op.drop_index(op.f('ix_reservations_user_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_status'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_library_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_id'), table_name='reservations')
    op.drop_index(op.f('ix_reservations_finna_id'), table_name='reservations')
    op.drop_table('reservations')
    
    op.drop_index(op.f('ix_wishlist_items_user_id'), table_name='wishlist_items')
    op.drop_index(op.f('ix_wishlist_items_id'), table_name='wishlist_items')
    op.drop_index(op.f('ix_wishlist_items_finna_id'), table_name='wishlist_items')
    op.drop_table('wishlist_items')
    
    op.drop_index('idx_library_city_active', table_name='libraries')
    op.drop_index('idx_library_coordinates', table_name='libraries')
    op.drop_index(op.f('ix_libraries_external_id'), table_name='libraries')
    op.drop_index(op.f('ix_libraries_library_system'), table_name='libraries')
    op.drop_index(op.f('ix_libraries_name'), table_name='libraries')
    op.drop_index(op.f('ix_libraries_id'), table_name='libraries')
    op.drop_index(op.f('ix_libraries_city'), table_name='libraries')
    op.drop_table('libraries')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS notificationtype')
    op.execute('DROP TYPE IF EXISTS reservationstatus')
