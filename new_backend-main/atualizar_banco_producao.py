"""Apply the pending production schema changes from models/database.py.

Run from this directory with:
    python atualizar_banco_producao.py

Set DATABASE_URL_MIGRATION (preferred) or DATABASE_URL in the environment or
in this directory's .env file. Pass --yes to skip the database-name prompt.
"""
import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import Integer, create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool


AMIGO_DEFAULTS = {
    "condicao_estado_Trancar1": "normal",
    "condicao_estado_Trancar2": "normal",
    "condicao_estado_Bloqueado1": "none",
    "condicao_estado_Bloqueado2": "none",
}
TURMA_TABLE = '"Turma_Aula"'
ADMIN_COLUMN = '"id_admin_Turma"'
ADMIN_FK_NAME = "fk_turma_aula_id_admin_usuario"


def build_database_url():
    raw_url = os.getenv("DATABASE_URL_MIGRATION") or os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError(
            "Defina DATABASE_URL_MIGRATION ou DATABASE_URL para a base de produção."
        )

    url = make_url(raw_url)
    if url.drivername == "postgres":
        url = url.set(drivername="postgresql")
    if not url.drivername.startswith("postgresql"):
        raise RuntimeError("Este script só permite atualizar PostgreSQL.")
    return url


def update_schema(connection):
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    required_tables = {"usuarios", "meus_amigos", "Turma_Aula"}
    missing_tables = required_tables - tables
    if missing_tables:
        raise RuntimeError(
            "Tabelas necessárias ausentes: " + ", ".join(sorted(missing_tables))
        )

    amigo_columns = {
        column["name"] for column in inspector.get_columns("meus_amigos")
    }
    turma_columns = {
        column["name"] for column in inspector.get_columns("Turma_Aula")
    }
    if "id_admin_Turma" not in turma_columns:
        raise RuntimeError('A coluna "Turma_Aula"."id_admin_Turma" não existe.')

    admin_column_info = next(
        column
        for column in inspector.get_columns("Turma_Aula")
        if column["name"] == "id_admin_Turma"
    )
    admin_is_integer = isinstance(admin_column_info["type"], Integer)

    null_admins = connection.scalar(text(
        f"SELECT COUNT(*) FROM {TURMA_TABLE} WHERE {ADMIN_COLUMN} IS NULL"
    ))
    if null_admins:
        raise RuntimeError(
            f"{null_admins} turma(s) não têm id_admin_Turma; "
            "corrija esses registos antes da atualização."
        )

    if not admin_is_integer:
        invalid_admins = connection.scalar(text(
            f"""
            SELECT COUNT(*)
            FROM {TURMA_TABLE}
            WHERE BTRIM({ADMIN_COLUMN}::text) !~ '^[0-9]+$'
            """
        ))
        if invalid_admins:
            raise RuntimeError(
                f"{invalid_admins} id_admin_Turma não numérico(s); "
                "nenhuma alteração foi aplicada."
            )

    admin_id_expression = (
        ADMIN_COLUMN
        if admin_is_integer
        else f"CAST({ADMIN_COLUMN} AS INTEGER)"
    )
    orphan_admins = connection.scalar(text(
        f"""
        SELECT COUNT(*)
        FROM {TURMA_TABLE} AS turma
        LEFT JOIN usuarios AS usuario
            ON usuario.id = {admin_id_expression}
        WHERE usuario.id IS NULL
        """
    ))
    if orphan_admins:
        raise RuntimeError(
            f"{orphan_admins} id_admin_Turma sem utilizador correspondente; "
            "nenhuma alteração foi aplicada."
        )

    foreign_keys = inspector.get_foreign_keys("Turma_Aula")
    admin_foreign_key_exists = any(
        foreign_key.get("constrained_columns") == ["id_admin_Turma"]
        and foreign_key.get("referred_table") == "usuarios"
        and foreign_key.get("referred_columns") == ["id"]
        for foreign_key in foreign_keys
    )
    conflicting_admin_foreign_key = any(
        foreign_key.get("constrained_columns") == ["id_admin_Turma"]
        and not (
            foreign_key.get("referred_table") == "usuarios"
            and foreign_key.get("referred_columns") == ["id"]
        )
        for foreign_key in foreign_keys
    )
    if conflicting_admin_foreign_key:
        raise RuntimeError(
            "id_admin_Turma já possui uma chave estrangeira incompatível."
        )

    changes = []
    for column_name, default_value in AMIGO_DEFAULTS.items():
        if column_name not in amigo_columns:
            connection.execute(text(
                f'ALTER TABLE "meus_amigos" ADD COLUMN "{column_name}" TEXT'
            ))
            changes.append(f"coluna meus_amigos.{column_name} adicionada")
        result = connection.execute(text(
            f'UPDATE "meus_amigos" SET "{column_name}" = :default '
            f'WHERE "{column_name}" IS NULL'
        ), {"default": default_value})
        if result.rowcount:
            changes.append(
                f"{result.rowcount} registo(s) em meus_amigos.{column_name} "
                "preenchido(s)"
            )

    if not admin_is_integer:
        connection.execute(text(
            f"ALTER TABLE {TURMA_TABLE} ALTER COLUMN {ADMIN_COLUMN} "
            f"TYPE INTEGER USING {ADMIN_COLUMN}::integer"
        ))
        changes.append("Turma_Aula.id_admin_Turma convertida para INTEGER")

    if admin_column_info["nullable"]:
        connection.execute(text(
            f"ALTER TABLE {TURMA_TABLE} ALTER COLUMN {ADMIN_COLUMN} SET NOT NULL"
        ))
        changes.append("Turma_Aula.id_admin_Turma definida como NOT NULL")

    if not admin_foreign_key_exists:
        connection.execute(text(
            f"ALTER TABLE {TURMA_TABLE} ADD CONSTRAINT {ADMIN_FK_NAME} "
            f"FOREIGN KEY ({ADMIN_COLUMN}) REFERENCES usuarios (id)"
        ))
        changes.append(
            "chave estrangeira Turma_Aula.id_admin_Turma -> usuarios.id adicionada"
        )

    return changes


def main():
    parser = argparse.ArgumentParser(
        description="Atualiza na produção as alterações pendentes do modelo de dados."
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="não pedir confirmação do nome da base de dados",
    )
    args = parser.parse_args()

    load_dotenv(Path(__file__).resolve().with_name(".env"))
    database_url = build_database_url()
    connect_args = {"connect_timeout": 30}
    if not database_url.query.get("sslmode"):
        connect_args["sslmode"] = "require"

    engine = create_engine(
        database_url,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args=connect_args,
    )
    try:
        with engine.connect() as connection:
            database_name = connection.scalar(text("SELECT current_database()"))
            print(f"Base PostgreSQL de destino: {database_name}")
            connection.commit()

            if not args.yes:
                confirmation = input(
                    f"Para continuar, escreva exatamente '{database_name}': "
                )
                if confirmation != database_name:
                    print("Atualização cancelada; nenhuma alteração foi aplicada.")
                    return 1

            with connection.begin():
                connection.execute(text(
                    'LOCK TABLE "meus_amigos", "Turma_Aula" '
                    "IN ACCESS EXCLUSIVE MODE"
                ))
                changes = update_schema(connection)

        if changes:
            print("Atualização concluída:")
            for change in changes:
                print(f"- {change}")
        else:
            print("A base já está atualizada; nenhuma alteração foi necessária.")
        return 0
    finally:
        engine.dispose()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        raise SystemExit(f"Erro ao atualizar a base de produção: {error}") from error
