"""Add attachment metadata to messages.

Revision ID: 9ea27418bc10
Revises: 7c184d91ac42
Create Date: 2026-10-13
"""
from alembic import op
import sqlalchemy as sa


revision = "9ea27418bc10"
down_revision = "7c184d91ac42"
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("menssagens")}
    file_columns = (
        ("file_url", sa.Text()),
        ("public_id", sa.Text()),
        ("file_name", sa.Text()),
        ("mime_type", sa.Text()),
        ("file_size", sa.Integer()),
    )
    for name, column_type in file_columns:
        if name not in columns:
            op.add_column(
                "menssagens",
                sa.Column(name, column_type, nullable=True)
            )


def downgrade():
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("menssagens")}
    for name in ("file_size", "mime_type", "file_name", "public_id", "file_url"):
        if name in columns:
            op.drop_column("menssagens", name)
