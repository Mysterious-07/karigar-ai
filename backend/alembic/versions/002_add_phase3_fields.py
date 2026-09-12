"""Add Phase 3 pricing and buyer match fields

Revision ID: 002_add_phase3_fields
Revises: 001_initial_schema
Create Date: 2026-09-08 13:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_phase3_fields'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Product fields
    op.add_column('products', sa.Column('material_cost', sa.Float(), nullable=True))
    op.add_column('products', sa.Column('labour_cost', sa.Float(), nullable=True))
    op.add_column('products', sa.Column('other_cost', sa.Float(), nullable=True))
    op.add_column('products', sa.Column('suggested_price', sa.Float(), nullable=True))
    op.add_column('products', sa.Column('pricing_explanation', sa.Text(), nullable=True))
    op.add_column('products', sa.Column('pricing_confidence', sa.String(length=50), nullable=True))

    # Buyer fields
    op.add_column('buyers', sa.Column('category', sa.String(length=100), nullable=True))
    op.add_column('buyers', sa.Column('preferred_crafts', sa.Text(), nullable=True))
    op.add_column('buyers', sa.Column('preferred_categories', sa.Text(), nullable=True))
    op.add_column('buyers', sa.Column('budget_min', sa.Float(), nullable=True))
    op.add_column('buyers', sa.Column('budget_max', sa.Float(), nullable=True))
    op.add_column('buyers', sa.Column('bulk_order_interest', sa.String(length=50), nullable=True))

    # BuyerMatch fields
    op.add_column('buyer_matches', sa.Column('status', sa.String(length=50), server_default='suggested', nullable=False))


def downgrade() -> None:
    op.drop_column('buyer_matches', 'status')

    op.drop_column('buyers', 'bulk_order_interest')
    op.drop_column('buyers', 'budget_max')
    op.drop_column('buyers', 'budget_min')
    op.drop_column('buyers', 'preferred_categories')
    op.drop_column('buyers', 'preferred_crafts')
    op.drop_column('buyers', 'category')

    op.drop_column('products', 'pricing_confidence')
    op.drop_column('products', 'pricing_explanation')
    op.drop_column('products', 'suggested_price')
    op.drop_column('products', 'other_cost')
    op.drop_column('products', 'labour_cost')
    op.drop_column('products', 'material_cost')
