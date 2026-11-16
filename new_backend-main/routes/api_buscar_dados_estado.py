from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, g, jsonify

from models.database import Adicionar_dados_estado
from service.friend_access import user_can_view_friend_status


DadosEstado = Blueprint("DadosEstados", __name__)


@DadosEstado.route("/api/buscar_dados_estado/<int:id_usuario>", methods=["GET"])
def dados_estado(id_usuario):
    try:
        viewer_id = int(g.principal["sub"])
    except (AttributeError, KeyError, TypeError, ValueError):
        return jsonify({"error": "Sessão inválida"}), 401

    if not user_can_view_friend_status(viewer_id, id_usuario):
        return jsonify({"error": "Sem permissão para consultar estes estados"}), 403

    try:
        states = Adicionar_dados_estado.query.filter(
            Adicionar_dados_estado.id_usuario == id_usuario,
            Adicionar_dados_estado.criado_em > datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24),
        ).all()
        return jsonify([
            {
                "id_usuario": state.id_usuario,
                "dados_estado": state.dados_estado,
                "media_blurhash": state.media_blurhash,
                "descricao_dados": state.descricao_dados,
                "visualizacao_dados": state.visualizacao_dados,
                "adoro_dados": state.adoro_dados,
                "tipo_estado": state.tipo_estado,
                "nome_usuario": state.nome_usuario_estado,
                "foto_usuario": state.foto_usuario_estado,
            }
            for state in states
        ]), 200
    except Exception:
        current_app.logger.exception("Falha ao consultar estados de utilizador")
        return jsonify({"error": "Não foi possível carregar os estados"}), 500
