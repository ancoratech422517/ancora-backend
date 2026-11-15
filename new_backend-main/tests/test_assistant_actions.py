import json
import tempfile
import unittest
from unittest.mock import Mock, patch

from flask import Flask

from models.database import (
    Adicionar_dados_estado,
    AssistantActionExecution,
    CRMRegistro,
    Registrar_produto,
    SocialPost,
    Usuario,
    db,
)
from routes.api_assistente_ia import assistant_bp
from service.assistant_actions import (
    execute_assistant_action,
    prepare_assistant_action,
    search_public_images,
)
from service.security_tokens import ACCESS_TOKEN_MANAGER_KEY, protect_private_routes
from tests.security_test_utils import configure_test_security


IMAGE_CANDIDATE = {
    "title": "File:Produto.jpg",
    "url": "https://upload.wikimedia.org/wikipedia/commons/example.jpg",
    "preview_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg",
    "source_url": "https://commons.wikimedia.org/wiki/File:Produto.jpg",
    "creator": "Pessoa Autora",
    "license": "CC BY-SA 4.0",
}


class AssistantActionTests(unittest.TestCase):
    def setUp(self):
        self.audit_directory = tempfile.TemporaryDirectory()
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="assistant-actions-test-secret-with-at-least-32-bytes",
            TESTING=True,
        )
        configure_test_security(
            self.app,
            f"{self.audit_directory.name}/audit.jsonl",
        )
        db.init_app(self.app)
        self.app.register_blueprint(assistant_bp)
        protect_private_routes(self.app)
        with self.app.app_context():
            db.create_all()
            db.session.add_all([
                Usuario(
                    id=1,
                    nome="Pessoa Um",
                    telefone="244923456789",
                    senha_hash="hash",
                    email="um@example.test",
                    data_nascimento="1990-01-01",
                ),
                Usuario(
                    id=2,
                    nome="Pessoa Dois",
                    telefone="244923456788",
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
        self.audit_directory.cleanup()

    def _headers(self, user_id=1):
        token = self.app.extensions[ACCESS_TOKEN_MANAGER_KEY].issue(
            str(user_id),
            roles=("user",),
            claims={"token_type": "access"},
        )
        return {"Authorization": f"Bearer {token}"}

    def _count(self, model, **filters):
        with self.app.app_context():
            return model.query.filter_by(**filters).count()

    def _create_and_execute(self, tool_name, arguments, images=None):
        with self.app.app_context():
            with patch(
                "service.assistant_actions.search_public_images",
                return_value=images or [],
            ):
                planned = prepare_assistant_action(1, tool_name, arguments)
            self.assertIn("pending_action", planned)
            return execute_assistant_action(
                1,
                planned["pending_action"]["token"],
                0 if images else None,
            )[0]

    def test_chat_previews_confirmed_project_and_replays_idempotently(self):
        provider_response = Mock()
        provider_response.ok = True
        provider_response.json.return_value = {
            "choices": [{
                "message": {
                    "tool_calls": [{
                        "type": "function",
                        "function": {
                            "name": "create_project",
                            "arguments": json.dumps({
                                "nome": "Loja online",
                                "cliente": "Cliente Um",
                                "estado": "Planeado",
                                "orcamento": 120000,
                                "prazo": "2026-12-01",
                                "progresso": 0,
                            }),
                        },
                    }]
                }
            }]
        }

        with (
            patch.dict("os.environ", {"SECRETY_KEY_IA_GROQ": "test-key"}),
            patch("routes.api_assistente_ia.requests.post", return_value=provider_response),
        ):
            preview = self.client.post(
                "/api/assistente-ia/chat",
                headers=self._headers(),
                json={"messages": [{"role": "user", "content": "Regista um projecto"}]},
            )

        self.assertEqual(preview.status_code, 200)
        self.assertIn("pending_action", preview.json)
        self.assertEqual(
            self._count(CRMRegistro, user_id=1, recurso="projectos"),
            0,
        )
        execution_payload = {"token": preview.json["pending_action"]["token"]}
        first = self.client.post(
            "/api/assistente-ia/actions/execute",
            headers=self._headers(),
            json=execution_payload,
        )
        replay = self.client.post(
            "/api/assistente-ia/actions/execute",
            headers=self._headers(),
            json=execution_payload,
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(replay.status_code, 200)
        self.assertEqual(first.json["result"], replay.json["result"])
        self.assertEqual(
            self._count(CRMRegistro, user_id=1, recurso="projectos"),
            1,
        )
        self.assertEqual(self._count(AssistantActionExecution), 1)

    def test_confirmation_token_cannot_be_used_by_another_account(self):
        with self.app.app_context():
            planned = prepare_assistant_action(
                1,
                "create_invoice",
                {
                    "numero": "F-100",
                    "cliente": "Cliente Um",
                    "valor": 5000,
                    "emissao": "2026-11-15",
                    "vencimento": "2026-12-15",
                    "estado": "Pendente",
                },
            )

        response = self.client.post(
            "/api/assistente-ia/actions/execute",
            headers=self._headers(2),
            json={"token": planned["pending_action"]["token"]},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self._count(CRMRegistro, recurso="faturas"), 0)

    def test_all_requested_account_resources_are_created_through_confirmation(self):
        product = self._create_and_execute(
            "create_product",
            {
                "nome_produto": "Sapatilhas",
                "descricao_produto": "Sapatilhas leves para corrida.",
                "tipo_produto": "Calçado",
                "preco_produto": "25000 Kz",
                "image_query": "sapatilhas corrida",
            },
            [IMAGE_CANDIDATE],
        )
        post = self._create_and_execute(
            "create_publication",
            {"texto": "Novidades na loja.", "image_query": "loja"},
            [IMAGE_CANDIDATE],
        )
        story = self._create_and_execute(
            "create_story",
            {"texto": "Bom dia!", "image_query": "paisagem"},
            [IMAGE_CANDIDATE],
        )
        project = self._create_and_execute(
            "create_project",
            {
                "nome": "Loja online",
                "cliente": "Cliente Um",
                "estado": "Planeado",
                "orcamento": 120000,
                "prazo": "2026-12-01",
                "progresso": 0,
            },
        )
        invoice = self._create_and_execute(
            "create_invoice",
            {
                "numero": "F-100",
                "cliente": "Cliente Um",
                "valor": 5000,
                "emissao": "2026-11-15",
                "vencimento": "2026-12-15",
                "estado": "Pendente",
            },
        )
        report = self._create_and_execute(
            "create_report",
            {
                "titulo": "Resumo mensal",
                "tipo": "Vendas",
                "periodo": "Novembro de 2026",
                "conteudo": "Resumo baseado nos dados fornecidos pelo utilizador.",
            },
        )
        class_record = self._create_and_execute(
            "create_class",
            {
                "nome": "Marketing Digital",
                "formador": "Formador Um",
                "alunos": 12,
                "horario": "Segunda às 14:00",
                "inicio": "2026-12-01",
                "estado": "Planeada",
            },
        )
        advertisement = self._create_and_execute(
            "create_advertisement",
            {
                "origem_tipo": "produto",
                "produto_ou_curso": "Sapatilhas",
                "descCurta": "Conforto para correr.",
                "descLonga": "Sapatilhas leves para treinos diários.",
                "beneficios": "Leves e confortáveis.",
            },
        )

        self.assertEqual(product["resource"], "produto")
        self.assertEqual(post["resource"], "publicacao")
        self.assertEqual(story["resource"], "estado")
        self.assertEqual(project["resource"], "projectos")
        self.assertEqual(invoice["resource"], "faturas")
        self.assertEqual(report["resource"], "relatorios")
        self.assertEqual(class_record["resource"], "turmas")
        self.assertEqual(advertisement["resource"], "anuncios")
        self.assertEqual(self._count(Registrar_produto, id_usuario=1), 1)
        self.assertEqual(self._count(SocialPost, user_id=1), 1)
        self.assertEqual(self._count(Adicionar_dados_estado, id_usuario=1), 1)
        with self.app.app_context():
            stored_product = Registrar_produto.query.filter_by(id=product["id"]).one()
            self.assertIn("Wikimedia Commons", stored_product.descricao_produto)
            self.assertEqual(stored_product.url_imagem_produto, IMAGE_CANDIDATE["url"])
            stored_state = Adicionar_dados_estado.query.filter_by(id=story["id"]).one()
            self.assertEqual(stored_state.tipo_estado, "imagem")
            self.assertEqual(stored_state.dados_estado, IMAGE_CANDIDATE["url"])
            self.assertEqual(stored_state.nome_usuario_estado, "Pessoa Um")

    def test_theme_change_returns_only_allowlisted_client_action(self):
        with self.app.app_context():
            action = prepare_assistant_action(
                1,
                "change_theme",
                {"scope": "chat_static", "theme_id": "aurora"},
            )

        self.assertEqual(
            action["client_action"],
            {"type": "change_theme", "scope": "chat_static", "theme_id": "aurora"},
        )
        self.assertNotIn("pending_action", action)

    def test_incomplete_story_does_not_create_an_action(self):
        with self.app.app_context():
            action = prepare_assistant_action(1, "create_story", {"texto": ""})

        self.assertIn("reply", action)
        self.assertNotIn("pending_action", action)
        self.assertEqual(self._count(Adicionar_dados_estado, id_usuario=1), 0)

    def test_wikimedia_search_excludes_noncommercial_licenses(self):
        def image_page(title, license_name):
            return {
                "title": title,
                "imageinfo": [{
                    "url": f"https://upload.wikimedia.org/{title}.jpg",
                    "thumburl": f"https://upload.wikimedia.org/thumb/{title}.jpg",
                    "descriptionurl": f"https://commons.wikimedia.org/wiki/{title}",
                    "extmetadata": {
                        "LicenseShortName": {"value": license_name},
                        "Artist": {"value": "<a>Autora</a>"},
                    },
                }],
            }

        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "query": {
                "pages": [
                    image_page("File:Permitida", "CC BY-SA 4.0"),
                    image_page("File:Uso-Nao-Comercial", "CC BY-NC 4.0"),
                ]
            }
        }
        with patch("service.assistant_actions.requests.get", return_value=response):
            images = search_public_images("produto")

        self.assertEqual(len(images), 1)
        self.assertEqual(images[0]["license"], "CC BY-SA 4.0")


if __name__ == "__main__":
    unittest.main()
