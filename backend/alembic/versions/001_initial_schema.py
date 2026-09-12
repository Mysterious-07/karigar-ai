"""Initial migration for Karigar AI schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-08 13:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Artisans Table
    op.create_table(
        'artisans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('craft_type', sa.String(length=100), nullable=False),
        sa.Column('profile_image', sa.String(length=500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_artisans_phone', 'artisans', ['phone'], unique=False)

    # 2. Products Table
    op.create_table(
        'products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('artisan_id', sa.UUID(), nullable=False),
        sa.Column('original_image', sa.String(length=500), nullable=True),
        sa.Column('processed_image', sa.String(length=500), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('craft_type', sa.String(length=100), nullable=False),
        sa.Column('material', sa.String(length=100), nullable=True),
        sa.Column('dimensions', sa.String(length=100), nullable=True),
        sa.Column('production_time', sa.String(length=100), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('suggested_min_price', sa.Float(), nullable=True),
        sa.Column('suggested_max_price', sa.Float(), nullable=True),
        sa.Column('artisan_story', sa.Text(), nullable=True),
        sa.Column('ai_quality_score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['artisan_id'], ['artisans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_products_artisan_id', 'products', ['artisan_id'], unique=False)

    # 3. Product Tags Table
    op.create_table(
        'product_tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('tag', sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_product_tags_product_id', 'product_tags', ['product_id'], unique=False)

    # 4. Buyers Table
    op.create_table(
        'buyers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('buyer_type', sa.String(length=100), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('min_order_quantity', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Buyer Matches Table
    op.create_table(
        'buyer_matches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('buyer_id', sa.UUID(), nullable=False),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['buyer_id'], ['buyers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_buyer_matches_buyer_id', 'buyer_matches', ['buyer_id'], unique=False)
    op.create_index('ix_buyer_matches_product_id', 'buyer_matches', ['product_id'], unique=False)

    # 6. Stores Table
    op.create_table(
        'stores',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('artisan_id', sa.UUID(), nullable=False),
        sa.Column('store_name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('qr_code_path', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['artisan_id'], ['artisans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_stores_artisan_id', 'stores', ['artisan_id'], unique=False)
    op.create_index('ix_stores_slug', 'stores', ['slug'], unique=True)

    # 7. Store Products Table
    op.create_table(
        'store_products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('store_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['store_id'], ['stores.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_store_products_product_id', 'store_products', ['product_id'], unique=False)
    op.create_index('ix_store_products_store_id', 'store_products', ['store_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_store_products_store_id', table_name='store_products')
    op.drop_index('ix_store_products_product_id', table_name='store_products')
    op.drop_table('store_products')

    op.drop_index('ix_stores_slug', table_name='stores')
    op.drop_index('ix_stores_artisan_id', table_name='stores')
    op.drop_table('stores')

    op.drop_index('ix_buyer_matches_product_id', table_name='buyer_matches')
    op.drop_index('ix_buyer_matches_buyer_id', table_name='buyer_matches')
    op.drop_table('buyer_matches')

    op.drop_table('buyers')

    op.drop_index('ix_product_tags_product_id', table_name='product_tags')
    op.drop_table('product_tags')

    op.drop_index('ix_products_artisan_id', table_name='products')
    op.drop_table('products')

    op.drop_index('ix_artisans_phone', table_name='artisans')
    op.drop_table('artisans')
