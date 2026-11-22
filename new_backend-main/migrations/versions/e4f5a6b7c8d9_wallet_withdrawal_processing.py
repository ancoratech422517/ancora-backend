"""Add administrative audit fields to wallet withdrawals.

Revision ID: e4f5a6b7c8d9
Revises: d1e2f3a4b5c6
Create Date: 2026-12-10
"""

from alembic import op
import sqlalchemy as sa


revision = "e4f5a6b7c8d9"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "wallet_movements",
        sa.Column("processed_by", sa.Integer(), nullable=True),
    )
    op.add_column(
        "wallet_movements",
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "wallet_movements",
        sa.Column("payout_reference", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "wallet_movements",
        sa.Column("admin_note", sa.String(length=500), nullable=True),
    )
    op.create_foreign_key(
        "fk_wallet_movements_processed_by_usuarios",
        "wallet_movements",
        "usuarios",
        ["processed_by"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    op.drop_constraint(
        "fk_wallet_movements_processed_by_usuarios",
        "wallet_movements",
        type_="foreignkey",
    )
    op.drop_column("wallet_movements", "admin_note")
    op.drop_column("wallet_movements", "payout_reference")
    op.drop_column("wallet_movements", "processed_at")
    op.drop_column("wallet_movements", "processed_by")
