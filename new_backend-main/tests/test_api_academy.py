import tempfile
import unittest

from flask import Flask

from models.database import (
    Adicionar_Nova_Aula,
    Agendar_Live_Turma,
    Turma_Aula,
    Usuario,
    db,
)
from routes.api_academy import academy_bp
from service.security_tokens import ACCESS_TOKEN_MANAGER_KEY, protect_private_routes
from tests.security_test_utils import configure_test_security


class AcademyApiTests(unittest.TestCase):
    def setUp(self):
        self.audit_directory = tempfile.TemporaryDirectory()
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="academy-test-secret-with-at-least-32-bytes",
            TESTING=True,
        )
        configure_test_security(
            self.app,
            f"{self.audit_directory.name}/audit.jsonl",
        )
        db.init_app(self.app)
        self.app.register_blueprint(academy_bp)
        protect_private_routes(self.app)
        with self.app.app_context():
            db.create_all()
            db.session.add_all([
                Usuario(
                    id=1,
                    nome="Professora",
                    telefone="100",
                    senha_hash="hash",
                    email="professora@example.test",
                    data_nascimento="1990-01-01",
                ),
                Usuario(
                    id=2,
                    nome="Professor externo",
                    telefone="200",
                    senha_hash="hash",
                    email="externo@example.test",
                    data_nascimento="1990-01-01",
                ),
            ])
            db.session.flush()
            db.session.add_all([
                Turma_Aula(
                    id_admin_Turma=1,
                    nome_Turma="Matemática",
                    tipo_usuario_Turma="admin",
                    id_aluno_Turma="1",
                    sala_Turma="room-teacher",
                ),
                Turma_Aula(
                    id_admin_Turma=2,
                    nome_Turma="Ciências",
                    tipo_usuario_Turma="admin",
                    id_aluno_Turma="2",
                    sala_Turma="room-student",
                ),
                Turma_Aula(
                    id_admin_Turma=2,
                    nome_Turma="Ciências",
                    tipo_usuario_Turma="aluno",
                    id_aluno_Turma="1",
                    sala_Turma="room-student",
                ),
            ])
            db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.audit_directory.cleanup()

    def authenticate(self, user_id):
        token = self.app.extensions[ACCESS_TOKEN_MANAGER_KEY].issue(
            str(user_id),
            roles=("user",),
            claims={"token_type": "access"},
        )
        self.client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    def test_academy_requires_auth_and_derives_both_roles_from_memberships(self):
        self.assertEqual(self.client.get("/api/academy").status_code, 401)

        self.authenticate(1)
        response = self.client.get("/api/academy")
        self.assertEqual(response.status_code, 200)
        result = response.get_json()

        self.assertEqual(result["roles"], {"student": True, "teacher": True})
        self.assertEqual([item["name"] for item in result["classes"]["teacher"]], ["Matemática"])
        self.assertEqual([item["name"] for item in result["classes"]["student"]], ["Ciências"])
        self.assertEqual(result["classes"]["student"][0]["teacher_name"], "Professor externo")
        self.assertEqual(result["classes"]["student"][0]["students"][0]["name"], "Professora")

    def test_teacher_writes_are_scoped_to_authenticated_user_and_owned_class(self):
        self.authenticate(1)
        created_class = self.client.post(
            "/api/academy/classes",
            json={"name": "História", "admin_id": 2},
        )
        self.assertEqual(created_class.status_code, 201)
        self.assertEqual(created_class.get_json()["item"]["admin_id"], 1)

        with self.app.app_context():
            own_class = Turma_Aula.query.filter_by(
                nome_Turma="Matemática",
                tipo_usuario_Turma="admin",
            ).first()
            other_class = Turma_Aula.query.filter_by(
                nome_Turma="Ciências",
                tipo_usuario_Turma="admin",
            ).first()
            own_class_id = own_class.id
            other_class_id = other_class.id

        scheduled = self.client.post(
            "/api/academy/schedules",
            json={
                "class_id": own_class_id,
                "title": "Revisão",
                "starts_at": "2099-05-15T10:30",
            },
        )
        self.assertEqual(scheduled.status_code, 201)
        self.assertEqual(scheduled.get_json()["item"]["teacher_id"], 1)

        forbidden_schedule = self.client.post(
            "/api/academy/schedules",
            json={
                "class_id": other_class_id,
                "title": "Sessão não autorizada",
                "starts_at": "2099-05-15T10:30",
            },
        )
        self.assertEqual(forbidden_schedule.status_code, 404)

        created_lesson = self.client.post(
            "/api/academy/lessons",
            json={
                "class_id": own_class_id,
                "title": "Frações",
                "video_url": "https://example.test/videos/fracoes.mp4",
            },
        )
        self.assertEqual(created_lesson.status_code, 201)
        self.assertEqual(created_lesson.get_json()["item"]["class_id"], own_class_id)
        academy_data = self.client.get("/api/academy").get_json()
        self.assertEqual(academy_data["lessons"][0]["title"], "Frações")
        self.assertTrue(academy_data["schedules"][0]["is_upcoming"])

        forbidden_lesson = self.client.post(
            "/api/academy/lessons",
            json={
                "class_id": other_class_id,
                "title": "Aula externa",
                "video_url": "https://example.test/videos/aula.mp4",
            },
        )
        self.assertEqual(forbidden_lesson.status_code, 404)

        with self.app.app_context():
            self.assertEqual(Agendar_Live_Turma.query.count(), 1)
            self.assertEqual(Adicionar_Nova_Aula.query.count(), 1)

    def test_duplicate_class_name_and_invalid_schedule_are_rejected(self):
        self.authenticate(1)
        duplicate = self.client.post(
            "/api/academy/classes",
            json={"name": "Matemática"},
        )
        self.assertEqual(duplicate.status_code, 409)

        with self.app.app_context():
            own_class = Turma_Aula.query.filter_by(
                nome_Turma="Matemática",
                tipo_usuario_Turma="admin",
            ).first()
            class_id = own_class.id

        invalid_lesson = self.client.post(
            "/api/academy/lessons",
            json={
                "class_id": class_id,
                "title": "URL inválida",
                "video_url": "http://[",
            },
        )
        self.assertEqual(invalid_lesson.status_code, 400)

        invalid_schedule = self.client.post(
            "/api/academy/schedules",
            json={
                "class_id": class_id,
                "title": "Sessão",
                "starts_at": "data-inválida",
            },
        )
        self.assertEqual(invalid_schedule.status_code, 400)


if __name__ == "__main__":
    unittest.main()
