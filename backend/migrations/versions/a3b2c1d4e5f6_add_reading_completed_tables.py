"""add reading and completed tables

Revision ID: a3b2c1d4e5f6
Revises: 9e5f45e51a2b
Create Date: 2025-12-03 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b2c1d4e5f6'
down_revision: Union[str, None] = '3b2c4d5e6f7g'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create reading_items table
    op.create_table(
        'reading_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('finna_id', sa.String(255), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('author', sa.String(300), nullable=True),
        sa.Column('cover_image', sa.Text(), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=False, default=0),
        sa.Column('library_id', sa.String(100), nullable=True),
        sa.Column('library_name', sa.String(200), nullable=True),
        sa.Column('due_date', sa.String(30), nullable=True),
        sa.Column('start_date', sa.String(30), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reading_items_id'), 'reading_items', ['id'], unique=False)
    op.create_index(op.f('ix_reading_items_user_id'), 'reading_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_reading_items_finna_id'), 'reading_items', ['finna_id'], unique=False)

    # Create completed_items table
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
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_completed_items_id'), 'completed_items', ['id'], unique=False)
    op.create_index(op.f('ix_completed_items_user_id'), 'completed_items', ['user_id'], unique=False)
    op.create_index(op.f('ix_completed_items_finna_id'), 'completed_items', ['finna_id'], unique=False)


def downgrade() -> None:
    # Drop completed_items table
    op.drop_index(op.f('ix_completed_items_finna_id'), table_name='completed_items')
    op.drop_index(op.f('ix_completed_items_user_id'), table_name='completed_items')
    op.drop_index(op.f('ix_completed_items_id'), table_name='completed_items')
    op.drop_table('completed_items')

    # Drop reading_items table
    op.drop_index(op.f('ix_reading_items_finna_id'), table_name='reading_items')
    op.drop_index(op.f('ix_reading_items_user_id'), table_name='reading_items')
    op.drop_index(op.f('ix_reading_items_id'), table_name='reading_items')
    op.drop_table('reading_items')
