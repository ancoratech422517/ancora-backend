"""Add optional Pushy device token to users.

Revision ID: 7c184d91ac42
Revises: 286fff34e9e6
Create Date: 2026-10-13
"""
from alembic import op
import sqlalchemy as sa


revision = "7c184d91ac42"
down_revision = "286fff34e9e6"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("usuarios")}
    if "id_app_usuario_pushy" not in columns:
        op.add_column(
            "usuarios",
            sa.Column("id_app_usuario_pushy", sa.Text(), nullable=True)
        )


def downgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("usuarios")}
    if "id_app_usuario_pushy" in columns:
        op.drop_column("usuarios", "id_app_usuario_pushy")
