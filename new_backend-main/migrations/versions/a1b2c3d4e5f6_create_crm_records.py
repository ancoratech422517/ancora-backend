"""Create per-user CRM records.

Revision ID: a1b2c3d4e5f6
Revises: 4f2b8a1d6c30
Create Date: 2026-11-11
"""
from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d4e5f6"
down_revision = "4f2b8a1d6c30"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("crm_registros"):
        op.create_table(
            "crm_registros",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("recurso", sa.String(length=32), nullable=False),
            sa.Column("dados", sa.JSON(), nullable=False),
            sa.Column(
                "criado_em",
                sa.DateTime(),
                server_default=sa.func.current_timestamp(),
                nullable=False,
            ),
            sa.Column(
                "atualizado_em",
                sa.DateTime(),
                server_default=sa.func.current_timestamp(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["usuarios.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    indexes = {index["name"] for index in sa.inspect(bind).get_indexes("crm_registros")}
    if "ix_crm_registros_user_recurso" not in indexes:
        op.create_index(
            "ix_crm_registros_user_recurso",
            "crm_registros",
            ["user_id", "recurso"],
            unique=False,
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("crm_registros"):
        indexes = {index["name"] for index in inspector.get_indexes("crm_registros")}
        if "ix_crm_registros_user_recurso" in indexes:
            op.drop_index("ix_crm_registros_user_recurso", table_name="crm_registros")
        op.drop_table("crm_registros")
