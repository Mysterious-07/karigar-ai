"""Add Phase 4 store public toggle, product slug, store product public toggle, and enquiries table

Revision ID: 003_add_phase4_fields
Revises: 002_add_phase3_fields
Create Date: 2026-09-08 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_phase4_fields'
down_revision: Union[str, None] = '002_add_phase3_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Store fields
    op.add_column('stores', sa.Column('is_public', sa.Boolean(), server_default='true', nullable=False))

    # 2. Product fields
    op.add_column('products', sa.Column('slug', sa.String(length=255), nullable=True))
    op.create_index('ix_products_slug', 'products', ['slug'], unique=False)

    # 3. Store Product fields
    op.add_column('store_products', sa.Column('is_public', sa.Boolean(), server_default='true', nullable=False))

    # 4. Enquiries Table
    op.create_table(
        'enquiries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('store_id', sa.UUID(), nullable=False),
        sa.Column('visitor_name', sa.String(length=255), nullable=True),
        sa.Column('visitor_contact', sa.String(length=255), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='new', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_enquiries_product_id', 'enquiries', ['product_id'], unique=False)
    op.create_index('ix_enquiries_store_id', 'enquiries', ['store_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_enquiries_store_id', table_name='enquiries')
    op.drop_index('ix_enquiries_product_id', table_name='enquiries')
    op.drop_table('enquiries')

    op.drop_column('store_products', 'is_public')

    op.drop_index('ix_products_slug', table_name='products')
    op.drop_column('products', 'slug')

    op.drop_column('stores', 'is_public')
