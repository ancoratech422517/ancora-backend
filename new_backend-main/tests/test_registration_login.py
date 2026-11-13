import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

from flask import Flask

from models.database import Usuario, db
from routes.api_me import login_bp
from routes.api_register import registrar
from service.database_schema import ensure_columns
from service.api_register import models


class RegistrationLoginTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="registration-login-test-secret",
        )
        db.init_app(self.app)
        self.app.register_blueprint(registrar)
        self.app.register_blueprint(login_bp)
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_registered_user_can_log_in_without_avatar_using_formatted_phone(self):
        registration = self.client.post(
            "/api/Registrar",
            data={
                "nome": "Conta de teste",
                "telefone": "244923456789",
                "senha": "senha-segura-123",
                "confirmar_senha": "senha-segura-123",
                "email": "teste@example.test",
                "data_nascimento": "inativo temporiamente",
            },
        )

        self.assertEqual(registration.status_code, 201)
        self.assertIs(registration.get_json()["status"], True)

        with self.app.app_context():
            with db.engine.begin() as connection:
                connection.exec_driver_sql(
                    "ALTER TABLE usuarios DROP COLUMN foto_usuario_blurhash"
                )
                connection.exec_driver_sql(
                    "ALTER TABLE usuarios DROP COLUMN id_app_usuario_pushy"
                )
            ensure_columns(db.engine, "usuarios", {
                "foto_usuario_blurhash": "VARCHAR(100)",
                "id_app_usuario_pushy": "TEXT",
            })

        with patch.dict("os.environ", {}, clear=True):
            login = self.client.post(
                "/Login",
                json={
                    "telefone": "+244 923 456 789",
                    "senha": "senha-segura-123",
                },
            )
            with redirect_stdout(io.StringIO()):
                profile = self.client.get("/api/me", base_url="https://localhost")

        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.get_json()["status"], "True")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["telefone"], "244923456789")
        with self.app.app_context():
            self.assertEqual(Usuario.query.filter_by(telefone="244923456789").count(), 1)

    def test_database_registration_failure_is_not_reported_as_success(self):
        with patch.object(models, "registrar_user_in_db", return_value=({"erro": "falha"}, 500)):
            response = self.client.post(
                "/api/Registrar",
                data={
                    "nome": "Conta sem gravação",
                    "telefone": "244923456789",
                    "senha": "senha-segura-123",
                    "confirmar_senha": "senha-segura-123",
                    "email": "sem-gravacao@example.test",
                    "data_nascimento": "inativo temporiamente",
                },
            )

        self.assertEqual(response.status_code, 500)
        self.assertIs(response.get_json()["status"], False)


if __name__ == "__main__":
    unittest.main()
