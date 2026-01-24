"""add brand settings

Revision ID: 012_add_brand_settings
Revises: 011_add_user_template_thumb
Create Date: 2025-01-24

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '012_add_brand_settings'
down_revision = '011_add_user_template_thumb'
branch_labels = None
depends_on = None


def upgrade():
    # 添加品牌配置字段
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('brand_name', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('brand_slogan', sa.String(200), nullable=True))
        batch_op.add_column(sa.Column('brand_description', sa.String(500), nullable=True))
        batch_op.add_column(sa.Column('admin_password_hash', sa.String(200), nullable=True))


def downgrade():
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.drop_column('admin_password_hash')
        batch_op.drop_column('brand_description')
        batch_op.drop_column('brand_slogan')
        batch_op.drop_column('brand_name')
