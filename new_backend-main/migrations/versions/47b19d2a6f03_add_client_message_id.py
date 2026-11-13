"""Add client message IDs for idempotent offline chat delivery.

Revision ID: 47b19d2a6f03
Revises: c13a4f6b2d91
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa


revision = "47b19d2a6f03"
down_revision = "c13a4f6b2d91"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("menssagens"):
        columns = {column["name"] for column in inspector.get_columns("menssagens")}
        if "client_message_id" not in columns:
            op.add_column(
                "menssagens",
                sa.Column("client_message_id", sa.String(length=80), nullable=True),
            )
        indexes = {index["name"] for index in sa.inspect(bind).get_indexes("menssagens")}
        if "ix_menssagens_client_message_id" not in indexes:
            op.create_index(
                "ix_menssagens_client_message_id",
                "menssagens",
                ["client_message_id"],
                unique=True,
            )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("menssagens"):
        indexes = {index["name"] for index in inspector.get_indexes("menssagens")}
        if "ix_menssagens_client_message_id" in indexes:
            op.drop_index("ix_menssagens_client_message_id", table_name="menssagens")
        columns = {column["name"] for column in sa.inspect(bind).get_columns("menssagens")}
        if "client_message_id" in columns:
            op.drop_column("menssagens", "client_message_id")
