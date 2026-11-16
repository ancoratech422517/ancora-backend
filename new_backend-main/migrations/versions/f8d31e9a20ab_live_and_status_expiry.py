"""Expire empty-class live schedules and user statuses."""
from alembic import op
import sqlalchemy as sa


revision = "f8d31e9a20ab"
down_revision = "ef8a09b7c231"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("Agendar_Live_Turma"):
        columns = {column["name"] for column in inspector.get_columns("Agendar_Live_Turma")}
        if "live_vazia_em" not in columns:
            op.add_column(
                "Agendar_Live_Turma",
                sa.Column("live_vazia_em", sa.DateTime(), nullable=True),
            )
        indexes = {index["name"] for index in sa.inspect(bind).get_indexes("Agendar_Live_Turma")}
        if "ix_Agendar_Live_Turma_live_vazia_em" not in indexes:
            op.create_index(
                "ix_Agendar_Live_Turma_live_vazia_em",
                "Agendar_Live_Turma",
                ["live_vazia_em"],
            )

    if inspector.has_table("Dados_Estado"):
        columns = {column["name"] for column in inspector.get_columns("Dados_Estado")}
        if "criado_em" not in columns:
            op.add_column(
                "Dados_Estado",
                sa.Column("criado_em", sa.DateTime(), nullable=True),
            )
        op.execute(sa.text(
            'UPDATE "Dados_Estado" '
            "SET criado_em = CURRENT_TIMESTAMP WHERE criado_em IS NULL"
        ))
        indexes = {index["name"] for index in sa.inspect(bind).get_indexes("Dados_Estado")}
        if "ix_Dados_Estado_criado_em" not in indexes:
            op.create_index(
                "ix_Dados_Estado_criado_em",
                "Dados_Estado",
                ["criado_em"],
            )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("Dados_Estado"):
        indexes = {index["name"] for index in inspector.get_indexes("Dados_Estado")}
        if "ix_Dados_Estado_criado_em" in indexes:
            op.drop_index("ix_Dados_Estado_criado_em", table_name="Dados_Estado")
        columns = {column["name"] for column in sa.inspect(bind).get_columns("Dados_Estado")}
        if "criado_em" in columns:
            op.drop_column("Dados_Estado", "criado_em")

    if inspector.has_table("Agendar_Live_Turma"):
        indexes = {index["name"] for index in sa.inspect(bind).get_indexes("Agendar_Live_Turma")}
        if "ix_Agendar_Live_Turma_live_vazia_em" in indexes:
            op.drop_index(
                "ix_Agendar_Live_Turma_live_vazia_em",
                table_name="Agendar_Live_Turma",
            )
        columns = {column["name"] for column in sa.inspect(bind).get_columns("Agendar_Live_Turma")}
        if "live_vazia_em" in columns:
            op.drop_column("Agendar_Live_Turma", "live_vazia_em")
