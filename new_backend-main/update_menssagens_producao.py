"""Add missing attachment and reply columns to the production messages table.

Set DATABASE_URL_MIGRATION to the production database URL, then run:
    python update_menssagens_producao.py
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url


MESSAGE_COLUMNS = {
    "file_url": "TEXT",
    "public_id": "TEXT",
    "file_name": "TEXT",
    "mime_type": "TEXT",
    "file_size": "INTEGER",
    "reply_to_id": "INTEGER",
    "reply_to_menssagem": "TEXT",
    "reply_to_nome": "VARCHAR(100)",
}


def main():
    load_dotenv(Path(__file__).with_name(".env"))
    database_url = os.getenv("DATABASE_URL_MIGRATION")
    if not database_url:
        raise SystemExit(
            "Defina DATABASE_URL_MIGRATION com a URL do banco de produção."
        )

    url = make_url(database_url)
    if url.drivername.startswith("postgres"):
        query = dict(url.query)
        query.setdefault("sslmode", "require")
        url = url.set(query=query)

    engine = create_engine(url, pool_pre_ping=True)
    try:
        with engine.begin() as connection:
            inspector = inspect(connection)
            if not inspector.has_table("menssagens"):
                raise RuntimeError("A tabela 'menssagens' não existe no banco.")

            existing_columns = {
                column["name"] for column in inspector.get_columns("menssagens")
            }
            added_columns = []

            for name, column_type in MESSAGE_COLUMNS.items():
                if name in existing_columns:
                    continue

                connection.execute(
                    text(
                        f'ALTER TABLE "menssagens" '
                        f'ADD COLUMN "{name}" {column_type}'
                    )
                )
                added_columns.append(name)

        if added_columns:
            print("Colunas adicionadas à tabela 'menssagens':")
            for name in added_columns:
                print(f"- {name}")
        else:
            print("A tabela 'menssagens' já contém todas as colunas necessárias.")

        verified_columns = {
            column["name"] for column in inspect(engine).get_columns("menssagens")
        }
        missing_columns = set(MESSAGE_COLUMNS) - verified_columns
        if missing_columns:
            raise RuntimeError(
                "Validação falhou; colunas ausentes: "
                + ", ".join(sorted(missing_columns))
            )

        print("Atualização e validação concluídas.")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
