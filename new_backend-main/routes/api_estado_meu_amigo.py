from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, g, jsonify

from models.database import Adicionar_dados_estado, Amigo
from service.friend_access import user_can_view_friend_status


EstadoMeuAmigo = Blueprint("EstadoMeuAmigo", __name__)


@EstadoMeuAmigo.route("/estado_meu_amigo/<int:id_usuario>", methods=["GET"])
def estado_meu_amigo(id_usuario):
    try:
        viewer_id = int(g.principal["sub"])
    except (AttributeError, KeyError, TypeError, ValueError):
        return jsonify({"error": "Sessão inválida"}), 401

    if viewer_id != id_usuario:
        return jsonify({"error": "Sem permissão para consultar estes estados"}), 403

    try:
        relationships = Amigo.query.filter(Amigo.id_usuario == viewer_id).all()
        states = []
        for relationship in relationships:
            friend_id = relationship.id_amigo
            if not user_can_view_friend_status(viewer_id, friend_id):
                continue
            friend_states = Adicionar_dados_estado.query.filter(
                Adicionar_dados_estado.id_usuario == friend_id,
                Adicionar_dados_estado.criado_em > datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24),
            ).all()
            for state in friend_states:
                states.append({
                    "id": state.id,
                    "id_usuario": state.id_usuario,
                    "dados_estado": state.dados_estado,
                    "media_blurhash": state.media_blurhash,
                    "descricao_dados": state.descricao_dados,
                    "visualizacao_dados": state.visualizacao_dados,
                    "adoro_dados": state.adoro_dados,
                    "tipo_estado": state.tipo_estado,
                    "nome_usuario_estado": state.nome_usuario_estado,
                    "foto_usuario_estado": state.foto_usuario_estado,
                })
        return jsonify(states), 200
    except Exception:
        current_app.logger.exception("Falha ao carregar estados de amizades")
        return jsonify({"error": "Não foi possível carregar os estados"}), 500
