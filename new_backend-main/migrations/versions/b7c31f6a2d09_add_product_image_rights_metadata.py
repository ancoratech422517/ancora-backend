"""Store source and license metadata for assistant-selected product images.

Revision ID: b7c31f6a2d09
Revises: f8d31e9a20ab
Create Date: 2026-11-17
"""
from alembic import op
import sqlalchemy as sa


revision = "b7c31f6a2d09"
down_revision = "f8d31e9a20ab"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("Produto_usuario"):
        return
    columns = {column["name"] for column in inspector.get_columns("Produto_usuario")}
    additions = (
        ("image_source_url", sa.Text()),
        ("image_creator", sa.String(length=200)),
        ("image_license", sa.String(length=120)),
    )
    for name, column_type in additions:
        if name not in columns:
            op.add_column("Produto_usuario", sa.Column(name, column_type, nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("Produto_usuario"):
        return
    columns = {column["name"] for column in inspector.get_columns("Produto_usuario")}
    for name in ("image_license", "image_creator", "image_source_url"):
        if name in columns:
            op.drop_column("Produto_usuario", name)
