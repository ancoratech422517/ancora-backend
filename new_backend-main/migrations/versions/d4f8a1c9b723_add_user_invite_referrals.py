"""Add user invitation codes and referral ownership."""
import secrets

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision = "d4f8a1c9b723"
down_revision = "f8d31e9a20ab"
branch_labels = None
depends_on = None


def _new_code(connection):
    while True:
        code = secrets.token_hex(8).upper()
        if not connection.execute(
            text("SELECT 1 FROM usuarios WHERE codigo_convite = :code LIMIT 1"),
            {"code": code},
        ).first():
            return code


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("usuarios")}

    if "codigo_convite" not in columns:
        op.add_column("usuarios", sa.Column("codigo_convite", sa.String(length=16), nullable=True))
    if "convidado_por_id" not in columns:
        op.add_column("usuarios", sa.Column("convidado_por_id", sa.Integer(), nullable=True))

    missing_codes = bind.execute(text(
        "SELECT id FROM usuarios WHERE codigo_convite IS NULL OR codigo_convite = ''"
    )).fetchall()
    for (user_id,) in missing_codes:
        bind.execute(
            text("UPDATE usuarios SET codigo_convite = :code WHERE id = :id"),
            {"code": _new_code(bind), "id": user_id},
        )

    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("usuarios")}
    foreign_keys = inspector.get_foreign_keys("usuarios")
    has_referrer_fk = any(
        fk.get("constrained_columns") == ["convidado_por_id"]
        and fk.get("referred_table") == "usuarios"
        for fk in foreign_keys
    )
    if columns["codigo_convite"].get("nullable", True) or not has_referrer_fk:
        with op.batch_alter_table("usuarios") as batch:
            if columns["codigo_convite"].get("nullable", True):
                batch.alter_column(
                    "codigo_convite",
                    existing_type=sa.String(length=16),
                    nullable=False,
                )
            if not has_referrer_fk:
                batch.create_foreign_key(
                    "fk_usuarios_convidado_por_id",
                    "usuarios",
                    ["convidado_por_id"],
                    ["id"],
                    ondelete="SET NULL",
                )

    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("usuarios")}
    if "uq_usuarios_codigo_convite" not in indexes:
        op.create_index(
            "uq_usuarios_codigo_convite",
            "usuarios",
            ["codigo_convite"],
            unique=True,
        )
    if "ix_usuarios_convidado_por_id" not in indexes:
        op.create_index(
            "ix_usuarios_convidado_por_id",
            "usuarios",
            ["convidado_por_id"],
            unique=False,
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("usuarios"):
        return

    indexes = {index["name"] for index in inspector.get_indexes("usuarios")}
    if "ix_usuarios_convidado_por_id" in indexes:
        op.drop_index("ix_usuarios_convidado_por_id", table_name="usuarios")
    if "uq_usuarios_codigo_convite" in indexes:
        op.drop_index("uq_usuarios_codigo_convite", table_name="usuarios")

    columns = {column["name"] for column in sa.inspect(bind).get_columns("usuarios")}
    foreign_keys = sa.inspect(bind).get_foreign_keys("usuarios")
    if "convidado_por_id" in columns or "codigo_convite" in columns:
        with op.batch_alter_table("usuarios") as batch:
            for fk in foreign_keys:
                if fk.get("constrained_columns") == ["convidado_por_id"] and fk.get("name"):
                    batch.drop_constraint(fk["name"], type_="foreignkey")
            if "convidado_por_id" in columns:
                batch.drop_column("convidado_por_id")
            if "codigo_convite" in columns:
                batch.drop_column("codigo_convite")
