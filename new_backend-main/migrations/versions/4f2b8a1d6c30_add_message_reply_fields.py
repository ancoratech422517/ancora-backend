"""Add reply metadata to messages.

Revision ID: 4f2b8a1d6c30
Revises: 9ea27418bc10
Create Date: 2026-11-06
"""
from alembic import op
import sqlalchemy as sa


revision = "4f2b8a1d6c30"
down_revision = "9ea27418bc10"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("menssagens")}
    reply_columns = (
        ("reply_to_id", sa.Integer()),
        ("reply_to_menssagem", sa.Text()),
        ("reply_to_nome", sa.String(length=100)),
    )
    for name, column_type in reply_columns:
        if name not in columns:
            op.add_column(
                "menssagens",
                sa.Column(name, column_type, nullable=True)
            )


def downgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("menssagens")}
    for name in ("reply_to_nome", "reply_to_menssagem", "reply_to_id"):
        if name in columns:
            op.drop_column("menssagens", name)
