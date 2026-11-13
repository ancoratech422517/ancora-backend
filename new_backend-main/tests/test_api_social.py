from datetime import datetime, timedelta, timezone
import unittest

import jwt
from flask import Flask

from models.database import Registrar_produto, Turma_Aula, Usuario, db
from routes.api_buscar_turma_usuario import turma_usuario
from routes.api_todos_produtos import Todos_produtos
from routes.api_social import social_bp


class SocialApiTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="social-test-secret-with-at-least-32-bytes",
        )
        db.init_app(self.app)
        self.app.register_blueprint(social_bp)
        self.app.register_blueprint(turma_usuario)
        self.app.register_blueprint(Todos_produtos)
        with self.app.app_context():
            db.create_all()
            db.session.add_all([
                Usuario(
                    nome="Pessoa Um",
                    telefone="100",
                    senha_hash="hash",
                    email="um@example.test",
                    data_nascimento="1990-01-01",
                    foto_usuario_blurhash="LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
                ),
                Usuario(
                    nome="Pessoa Dois",
                    telefone="200",
                    senha_hash="hash",
                    email="dois@example.test",
                    data_nascimento="1990-01-01",
                ),
            ])
            db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def authenticate(self, user_id):
        token = jwt.encode(
            {
                "id": user_id,
                "type": "access",
                "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
            },
            self.app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        self.client.set_cookie("token_sessao", token)

    def test_social_interactions_are_persisted(self):
        self.authenticate(1)
        created = self.client.post("/api/social/posts", json={"texto": "Olá #Ancora"})
        self.assertEqual(created.status_code, 201)
        post_id = created.get_json()["item"]["id"]

        liked = self.client.post(f"/api/social/posts/{post_id}/like")
        self.assertEqual(liked.get_json(), {"curtido": True, "curtidas": 1})
        commented = self.client.post(
            f"/api/social/posts/{post_id}/comments",
            json={"texto": "Boa publicação"},
        )
        self.assertEqual(commented.status_code, 201)
        bookmarked = self.client.post(f"/api/social/posts/{post_id}/bookmark")
        self.assertTrue(bookmarked.get_json()["guardado"])

        saved = self.client.get("/api/social/posts?feed=saved").get_json()["items"]
        self.assertEqual(len(saved), 1)
        self.assertEqual(saved[0]["comentarios"], 1)

        followed = self.client.post("/api/social/users/2/follow")
        self.assertTrue(followed.get_json()["seguindo"])
        story = self.client.post("/api/social/stories", json={"texto": "Story de teste"})
        self.assertEqual(story.status_code, 201)

        self.authenticate(2)
        story_id = story.get_json()["item"]["id"]
        self.assertEqual(self.client.post(f"/api/social/stories/{story_id}/view").status_code, 200)

        self.authenticate(1)
        stories = self.client.get("/api/social/stories").get_json()["items"]
        self.assertEqual(stories[0]["visualizacoes"], 1)
        self.assertEqual(
            stories[0]["autor"]["foto_usuario_blurhash"],
            "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
        )

    def test_blurhash_fields_persist_for_profile_product_and_course_images(self):
        blurhash = "LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
        with self.app.app_context():
            product = Registrar_produto(
                nome_produto="Produto",
                descricao_produto="Descrição",
                tipo_produto="Geral",
                preco_produto="100",
                url_imagem_produto="https://example.test/produto.webp",
                url_imagem_produto_blurhash=blurhash,
                nome_vendedor="Pessoa Um",
                id_usuario=1,
            )
            course = Turma_Aula(
                id_admin_Turma=1,
                nome_Turma="Curso",
                tipo_usuario_Turma="admin",
                id_aluno_Turma="1",
                imagem_perfil_Turma="https://example.test/curso.webp",
                imagem_perfil_Turma_blurhash=blurhash,
            )
            db.session.add_all([product, course])
            db.session.commit()

            self.assertEqual(
                db.session.get(Registrar_produto, product.id).url_imagem_produto_blurhash,
                blurhash,
            )
            self.assertEqual(
                db.session.get(Turma_Aula, course.id).imagem_perfil_Turma_blurhash,
                blurhash,
            )

        products = self.client.get("/buscar_todos_produtos/1").get_json()
        self.assertEqual(products[0]["url_imagem_produto_blurhash"], blurhash)
        self.assertEqual(products[0]["foto_vendedor_blurhash"], blurhash)

        courses = self.client.get("/buscar_turma_usuario/1").get_json()
        self.assertEqual(courses[0]["imagem_perfil_Turma_blurhash"], blurhash)
        self.assertEqual(courses[0]["foto_aluno_turma_blurhash"], blurhash)

    def test_social_endpoints_require_a_valid_session(self):
        response = self.client.get("/api/social/posts")
        self.assertEqual(response.status_code, 401)

    def test_blurhash_is_saved_and_returned_for_social_media(self):
        self.authenticate(1)
        blurhash = "LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
        post = self.client.post(
            "/api/social/posts",
            json={
                "texto": "Imagem de teste",
                "media_url": "https://res.cloudinary.com/test/image/upload/example.webp",
                "media_type": "image",
                "media_blurhash": blurhash,
            },
        )
        self.assertEqual(post.status_code, 201)
        self.assertEqual(post.get_json()["item"]["media_blurhash"], blurhash)

        story = self.client.post(
            "/api/social/stories",
            json={
                "texto": "Story de teste",
                "media_url": "https://res.cloudinary.com/test/image/upload/story.webp",
                "media_type": "image",
                "media_blurhash": blurhash,
            },
        )
        self.assertEqual(story.status_code, 201)
        self.assertEqual(story.get_json()["item"]["media_blurhash"], blurhash)

        invalid = self.client.post(
            "/api/social/posts",
            json={"texto": "Hash inválido", "media_blurhash": "invalid!"},
        )
        self.assertEqual(invalid.status_code, 400)


if __name__ == "__main__":
    unittest.main()
