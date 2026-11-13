import importlib.util
import unittest
from unittest.mock import patch
from pathlib import Path

from flask import Flask
from sqlalchemy import create_engine, inspect
from alembic.migration import MigrationContext
from alembic.operations import Operations

from models.database import Menssagens, Usuario, db
from routes.websocket_enviar_menssagem import enviar_menssagem_na_sala

MIGRATION_PATH = Path(__file__).resolve().parents[1] / "migrations" / "versions" / "47b19d2a6f03_add_client_message_id.py"
MIGRATION_SPEC = importlib.util.spec_from_file_location("offline_chat_migration", MIGRATION_PATH)
add_client_message_id = importlib.util.module_from_spec(MIGRATION_SPEC)
MIGRATION_SPEC.loader.exec_module(add_client_message_id)


class OfflineChatTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
        )
        db.init_app(self.app)
        with self.app.app_context():
            db.create_all()
            db.session.add_all([
                Usuario(
                    nome="Remetente",
                    telefone="100",
                    senha_hash="hash",
                    email="remetente@example.test",
                    data_nascimento="1990-01-01",
                ),
                Usuario(
                    nome="Destinatário",
                    telefone="200",
                    senha_hash="hash",
                    email="destinatario@example.test",
                    data_nascimento="1990-01-01",
                ),
            ])
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_replayed_client_message_id_persists_only_one_message(self):
        payload = {
            "client_message_id": "offline-client-message-1",
            "nossa_sala": "room-1",
            "id_remitente": 1,
            "id_amigo": 2,
            "nome_remitente": "Remetente",
            "nome_amigo": "Destinatário",
            "menssagem": "Mensagem criada offline",
        }
        with self.app.app_context(), \
             patch("routes.websocket_enviar_menssagem.emit"), \
             patch("routes.websocket_enviar_menssagem.enviar_notificacao_pushy"):
            first = enviar_menssagem_na_sala(payload)
            replay = enviar_menssagem_na_sala(payload)

            self.assertTrue(first["success"])
            self.assertTrue(replay["success"])
            self.assertEqual(first["mensagem_id"], replay["mensagem_id"])
            self.assertEqual(
                Menssagens.query.filter_by(client_message_id=payload["client_message_id"]).count(),
                1,
            )

    def test_migration_adds_unique_client_message_id_index(self):
        engine = create_engine("sqlite://")
        with engine.begin() as connection:
            connection.exec_driver_sql("CREATE TABLE menssagens (id INTEGER PRIMARY KEY)")
            with Operations.context(MigrationContext.configure(connection)):
                add_client_message_id.upgrade()

            columns = {column["name"] for column in inspect(connection).get_columns("menssagens")}
            indexes = {index["name"]: index for index in inspect(connection).get_indexes("menssagens")}
            self.assertIn("client_message_id", columns)
            self.assertTrue(indexes["ix_menssagens_client_message_id"]["unique"])
        engine.dispose()
