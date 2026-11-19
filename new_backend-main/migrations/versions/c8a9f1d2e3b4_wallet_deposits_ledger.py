"""Create wallet deposits and ledger tables."""

from alembic import op
import sqlalchemy as sa


revision = "c8a9f1d2e3b4"
down_revision = ("d4f8a1c9b723", "b7c31f6a2d09")
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("wallet_deposits"):
        op.create_table(
            "wallet_deposits",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("reference_id", sa.String(length=80), nullable=False),
            sa.Column("provider_transaction_id", sa.String(length=120), nullable=True),
            sa.Column("amount", sa.Numeric(18, 2), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False),
            sa.Column("payment_method", sa.String(length=32), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="PENDING"),
            sa.Column("checkout_url", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
            sa.UniqueConstraint("reference_id", name="uq_wallet_deposit_reference"),
            sa.UniqueConstraint(
                "provider_transaction_id",
                name="uq_wallet_deposit_provider_transaction",
            ),
        )
    deposit_indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("wallet_deposits")
    }
    if "ix_wallet_deposit_user_created" not in deposit_indexes:
        op.create_index(
            "ix_wallet_deposit_user_created",
            "wallet_deposits",
            ["user_id", "created_at"],
        )

    if not sa.inspect(bind).has_table("wallet_ledger_entries"):
        op.create_table(
            "wallet_ledger_entries",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "deposit_id",
                sa.Integer(),
                sa.ForeignKey("wallet_deposits.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("entry_type", sa.String(length=20), nullable=False),
            sa.Column("amount", sa.Numeric(18, 2), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
            sa.UniqueConstraint("deposit_id", name="uq_wallet_ledger_deposit"),
        )
    ledger_indexes = {
        index["name"] for index in sa.inspect(bind).get_indexes("wallet_ledger_entries")
    }
    if "ix_wallet_ledger_user_created" not in ledger_indexes:
        op.create_index(
            "ix_wallet_ledger_user_created",
            "wallet_ledger_entries",
            ["user_id", "created_at"],
        )


def downgrade():
    op.drop_index("ix_wallet_ledger_user_created", table_name="wallet_ledger_entries")
    op.drop_table("wallet_ledger_entries")
    op.drop_index("ix_wallet_deposit_user_created", table_name="wallet_deposits")
    op.drop_table("wallet_deposits")
