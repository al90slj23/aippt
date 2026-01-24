"""add brand logo and favicon

Revision ID: 013_add_brand_logo_favicon
Revises: 012_add_brand_settings
Create Date: 2025-01-24

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '013_add_brand_logo_favicon'
down_revision = '012_add_brand_settings'
branch_labels = None
depends_on = None


def upgrade():
    # Add brand_logo_url and brand_favicon_url columns to settings table
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('brand_logo_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('brand_favicon_url', sa.String(length=500), nullable=True))


def downgrade():
    # Remove brand_logo_url and brand_favicon_url columns from settings table
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.drop_column('brand_favicon_url')
        batch_op.drop_column('brand_logo_url')
