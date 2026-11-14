import ast
import importlib
import tempfile
import unittest
import uuid
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from flask import Flask
from werkzeug.routing import FloatConverter, IntegerConverter, UUIDConverter

from ancorashield.auth.rate_limit import RateLimiter
from models.database import Registrar_produto, Usuario, db
from service.security_tokens import (
    ACCESS_TOKEN_MANAGER_KEY,
    SECURITY_EXTENSION_KEY,
    protect_private_routes,
)
from tests.security_test_utils import configure_test_security


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _registered_blueprints():
    app_tree = ast.parse((BACKEND_ROOT / "app.py").read_text(encoding="utf-8"))
    imports = {}
    registrations = []

    for node in ast.walk(app_tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            if node.module.startswith("routes."):
                for alias in node.names:
                    imports[alias.asname or alias.name] = (node.module, alias.name)
        elif (
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "app"
            and node.func.attr == "register_blueprint"
            and node.args
            and isinstance(node.args[0], ast.Name)
        ):
            registrations.append(node.args[0].id)

    blueprints = []
    for registered_name in registrations:
        module_name, attribute_name = imports[registered_name]
        blueprints.append(
            getattr(importlib.import_module(module_name), attribute_name)
        )
    return blueprints


def _url_for_rule(adapter, rule, method):
    values = dict(rule.defaults or {})
    for name, converter in rule._converters.items():
        if name in values:
            continue
        if isinstance(converter, IntegerConverter):
            values[name] = 1
        elif isinstance(converter, FloatConverter):
            values[name] = 1.0
        elif isinstance(converter, UUIDConverter):
            values[name] = uuid.uuid4()
        else:
            values[name] = "route-test"
    return adapter.build(rule.endpoint, values, method=method)


class AllApiRoutesTests(unittest.TestCase):
    def setUp(self):
        self.audit_directory = tempfile.TemporaryDirectory()
        self.app = Flask(__name__)
        self.app.config.update(
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SECRET_KEY="all-api-routes-test-secret-32-bytes",
            TESTING=True,
        )
        configure_test_security(
            self.app,
            f"{self.audit_directory.name}/audit.jsonl",
        )
        self.app.extensions[SECURITY_EXTENSION_KEY].rate_limiter = RateLimiter(
            max_requests=5000,
            window_seconds=60,
        )
        db.init_app(self.app)
        for blueprint in _registered_blueprints():
            self.app.register_blueprint(blueprint)
        protect_private_routes(self.app)
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.audit_directory.cleanup()

    def test_registered_routes_resolve_and_reject_requests_without_auth(self):
        adapter = self.app.url_map.bind("localhost")
        route_count = 0

        for rule in self.app.url_map.iter_rules():
            if rule.endpoint == "static":
                continue
            route_count += 1
            options_path = _url_for_rule(adapter, rule, "OPTIONS")
            options_response = self.client.options(options_path)
            self.assertLess(
                options_response.status_code,
                500,
                f"OPTIONS {options_path} failed",
            )

            if (
                rule.rule in {"/Login", "/refresh", "/api/Registrar"}
                or rule.rule.startswith("/api/crm/public/")
            ):
                continue

            for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
                path = _url_for_rule(adapter, rule, method)
                response = self.client.open(path, method=method)
                self.assertEqual(
                    response.status_code,
                    401,
                    f"{method} {path} should require a bearer token",
                )

        self.assertGreater(route_count, 0)

    def test_authenticated_user_can_register_a_product(self):
        with self.app.app_context():
            usuario = Usuario(
                nome="Vendedor de teste",
                telefone="244900000001",
                senha_hash="hash-de-teste",
                email="vendedor@example.test",
                data_nascimento="1990-01-01",
            )
            db.session.add(usuario)
            db.session.commit()
            usuario_id = usuario.id
            token = self.app.extensions[ACCESS_TOKEN_MANAGER_KEY].issue(
                str(usuario_id),
                roles=("user",),
                claims={"token_type": "access"},
            )

        with (
            patch(
                "routes.api_registrar_produto.cloudinary.uploader.upload",
                return_value={"secure_url": "https://images.example.test/product.jpg"},
            ),
            patch("routes.api_registrar_produto.socketio.emit"),
        ):
            response = self.client.post(
                "/registrar_produto",
                headers={"Authorization": f"Bearer {token}"},
                data={
                    "nome_produto": "Produto de teste",
                    "descricao_produto": "Descrição de teste",
                    "tipo_produto": "geral",
                    "preco_produto": "100",
                    "id_usuario": str(usuario_id),
                    "nome_vendedor": "Vendedor de teste",
                    "imagem_blurhash": "",
                    "imagem_produto": (BytesIO(b"imagem de teste"), "produto.jpg"),
                },
                content_type="multipart/form-data",
            )

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(
            response.get_json()["status"],
            "produto registrado com sucesso!",
        )
        with self.app.app_context():
            produto = Registrar_produto.query.one()
            self.assertEqual(produto.id_usuario, usuario_id)
            self.assertEqual(produto.nome_produto, "Produto de teste")


if __name__ == "__main__":
    unittest.main()
