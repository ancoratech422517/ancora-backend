"""Add wallet movements for transfers and withdrawals.

Revision ID: d1e2f3a4b5c6
Revises: c8a9f1d2e3b4
Create Date: 2026-11-19
"""

from alembic import op
import sqlalchemy as sa


revision = "d1e2f3a4b5c6"
down_revision = "c8a9f1d2e3b4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "wallet_movements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reference_id", sa.String(length=80), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("recipient_id", sa.Integer(), nullable=True),
        sa.Column("account_phone", sa.String(length=20), nullable=False),
        sa.Column("movement_type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["recipient_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sender_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_id", name="uq_wallet_movement_reference"),
    )
    op.create_index(
        "ix_wallet_movement_users_created",
        "wallet_movements",
        ["sender_id", "recipient_id", "created_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_wallet_movement_users_created", table_name="wallet_movements")
    op.drop_table("wallet_movements")
