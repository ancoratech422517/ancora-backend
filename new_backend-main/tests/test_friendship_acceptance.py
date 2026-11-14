import unittest
from unittest.mock import patch

from flask import Flask

from models.database import Amigo, Amizade, Usuario, db
from routes.websocket_aceitar_pedido_amizade import Aceitar_pedido_amizade
from service.api_meus_amigos_service import Meus_amigos


class FriendshipAcceptanceTests(unittest.TestCase):
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
                    nome="Pessoa que enviou",
                    telefone="100",
                    senha_hash="hash",
                    email="remetente@example.test",
                    data_nascimento="1990-01-01",
                ),
                Usuario(
                    nome="Pessoa que aceitou",
                    telefone="200",
                    senha_hash="hash",
                    email="destinatario@example.test",
                    data_nascimento="1990-01-01",
                ),
            ])
            db.session.add(Amigo(
                id_usuario=1,
                id_amigo=2,
                foto_amigo="none",
                nossa_sala="sala_1_2",
            ))
            db.session.add(Amizade(
                remetente_id=1,
                destinatario_id=2,
                tipo_notificacao="pedido_amizade",
                status="pendente",
            ))
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_acceptance_creates_missing_direction_for_accepting_user(self):
        payload = {
            "ID_destinatario": 1,
            "ID_remitente": 1,
            "nome_remitente": "Pessoa que aceitou",
            "foto_remitente": "foto-2",
            "foto_destinatario": "foto-1",
        }

        with self.app.app_context(), patch(
            "routes.websocket_aceitar_pedido_amizade.emit"
        ), patch(
            "routes.websocket_aceitar_pedido_amizade.get_user_id_from_cookie",
            return_value="2",
        ):
            Aceitar_pedido_amizade(payload)

            amigos = Meus_amigos.Listar_todos_meus_amigos(2)

            self.assertEqual([amigo["id_amigo"] for amigo in amigos], [1])
            self.assertEqual(
                Amigo.query.filter_by(id_usuario=1, id_amigo=2).count(),
                1,
            )
            self.assertEqual(
                Amigo.query.filter_by(id_usuario=2, id_amigo=1).count(),
                1,
            )
            self.assertEqual(
                Amizade.query.filter_by(
                    remetente_id=1,
                    destinatario_id=2,
                    tipo_notificacao="pedido_amizade",
                ).count(),
                0,
            )


if __name__ == "__main__":
    unittest.main()
