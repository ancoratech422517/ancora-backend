import secrets

from sqlalchemy import text

from service.database_schema import ensure_columns


def gerar_codigo_convite():
    return secrets.token_hex(8).upper()


def ensure_referral_schema(engine):
    ensure_columns(engine, "usuarios", {
        "codigo_convite": "VARCHAR(16)",
        "convidado_por_id": "INTEGER",
    })

    with engine.begin() as connection:
        connection.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_codigo_convite "
            "ON usuarios (codigo_convite)"
        ))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_usuarios_convidado_por_id "
            "ON usuarios (convidado_por_id)"
        ))

        usuarios_sem_codigo = connection.execute(text(
            "SELECT id FROM usuarios "
            "WHERE codigo_convite IS NULL OR codigo_convite = ''"
        )).fetchall()
        for (usuario_id,) in usuarios_sem_codigo:
            codigo = gerar_codigo_convite()
            while connection.execute(
                text("SELECT 1 FROM usuarios WHERE codigo_convite = :codigo LIMIT 1"),
                {"codigo": codigo},
            ).first():
                codigo = gerar_codigo_convite()
            connection.execute(
                text("UPDATE usuarios SET codigo_convite = :codigo WHERE id = :id"),
                {"codigo": codigo, "id": usuario_id},
            )
