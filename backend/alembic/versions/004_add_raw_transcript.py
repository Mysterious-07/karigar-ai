"""Add raw_transcript field to products for separate voice transcript storage

Revision ID: 004_add_raw_transcript
Revises: 003_add_phase4_fields
Create Date: 2026-09-10 17:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_raw_transcript'
down_revision: Union[str, None] = '003_add_phase4_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('raw_transcript', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'raw_transcript')