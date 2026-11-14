import tempfile
import unittest
from unittest.mock import patch

from flask import Flask
from werkzeug.security import generate_password_hash

from models.database import Usuario, db
from routes.api_me import login_bp
from routes.api_register import registrar
from service.database_schema import ensure_columns
from service.api_register import models
from service.password_security import hash_password
from service.security_tokens import access_token_manager, protect_private_routes
from tests.security_test_utils import configure_test_security


class RegistrationLoginTests(unittest.TestCase):
    def setUp(self):
        self.audit_directory = tempfile.TemporaryDirectory()
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="registration-login-test-secret-32",
            TESTING=True,
        )
        configure_test_security(
            self.app,
            f"{self.audit_directory.name}/audit.jsonl",
        )
        db.init_app(self.app)
        self.app.register_blueprint(registrar)
        self.app.register_blueprint(login_bp)
        protect_private_routes(self.app)
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.audit_directory.cleanup()

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
            profile = self.client.get(
                "/api/me",
                base_url="https://localhost",
                headers={
                    "Authorization": f"Bearer {login.get_json()['access_token']}"
                },
            )

        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.get_json()["status"], "True")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["telefone"], "244923456789")
        with self.app.app_context():
            usuario = Usuario.query.filter_by(telefone="244923456789").one()
            self.assertTrue(usuario.senha_hash.startswith("$argon2id$"))
            self.assertTrue(
                self.app.extensions["ancorashield.audit_log"].verify()
            )

    def test_successful_login_upgrades_legacy_werkzeug_hash(self):
        with self.app.app_context():
            usuario = Usuario(
                nome="Conta legada",
                telefone="244923456789",
                senha_hash=generate_password_hash("senha-legada-123"),
                email="legada@example.test",
                data_nascimento="1990-01-01",
            )
            db.session.add(usuario)
            db.session.commit()

        response = self.client.post(
            "/Login",
            json={
                "telefone": "244923456789",
                "senha": "senha-legada-123",
            },
        )

        self.assertEqual(response.status_code, 200)
        with self.app.app_context():
            usuario = Usuario.query.filter_by(telefone="244923456789").one()
            self.assertTrue(usuario.senha_hash.startswith("$argon2id$"))

    def test_refresh_returns_a_bearer_token_and_legacy_cookie_cannot_authenticate(self):
        with self.app.app_context():
            usuario = Usuario(
                nome="Conta de sessão",
                telefone="244923456789",
                senha_hash=hash_password("senha"),
                email="sessao@example.test",
                data_nascimento="1990-01-01",
            )
            db.session.add(usuario)
            db.session.commit()

        login = self.client.post(
            "/Login",
            json={"telefone": "244923456789", "senha": "senha"},
        )
        self.assertEqual(login.status_code, 200)
        with self.app.app_context():
            claims = access_token_manager().verify(login.get_json()["access_token"])
        self.assertEqual(claims["roles"], ["user"])
        self.assertEqual(claims["token_type"], "access")

        unauthorized = self.client.get(
            "/api/me",
            base_url="https://localhost",
            headers={"Cookie": "token_sessao=legacy-cookie"},
        )
        self.assertEqual(unauthorized.status_code, 401)

        refreshed = self.client.post(
            "/refresh",
            base_url="https://localhost",
            headers={"Origin": "http://localhost:5173"},
        )
        self.assertEqual(refreshed.status_code, 200)
        self.assertTrue(refreshed.get_json()["access_token"])
        refreshed_profile = self.client.get(
            "/api/me",
            base_url="https://localhost",
            headers={
                "Authorization": (
                    f"Bearer {refreshed.get_json()['access_token']}"
                )
            },
        )
        self.assertEqual(refreshed_profile.status_code, 200)

        rejected_origin = self.client.post(
            "/refresh",
            base_url="https://localhost",
            headers={"Origin": "https://evil.example"},
        )
        self.assertEqual(rejected_origin.status_code, 403)

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
