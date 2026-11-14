import unittest

from flask import Flask, g

from models.database import Usuario, db
from routes.api_usuario import users_bp


class UserListSecurityTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
        )
        db.init_app(self.app)
        self.app.register_blueprint(users_bp)

        @self.app.before_request
        def set_test_principal():
            g.principal = {"sub": "1", "roles": ["user"]}

        with self.app.app_context():
            db.create_all()
            db.session.add_all([
                Usuario(
                    nome="Pessoa logada",
                    telefone="100",
                    senha_hash="hash",
                    email="logada@example.test",
                    data_nascimento="1990-01-01",
                ),
                Usuario(
                    nome="Outro usuário",
                    telefone="200",
                    senha_hash="hash",
                    email="outro@example.test",
                    data_nascimento="1990-01-01",
                ),
            ])
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_list_uses_authenticated_user_and_does_not_expose_phone_numbers(self):
        response = self.app.test_client().get("/usuarios/lista/1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json[0]["id"], 2)
        self.assertNotIn("telefone", response.json[0])

    def test_list_rejects_another_users_id(self):
        response = self.app.test_client().get("/usuarios/lista/2")

        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
