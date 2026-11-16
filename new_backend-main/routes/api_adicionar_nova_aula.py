import os
import time
from urllib.parse import urlsplit

import cloudinary
import cloudinary.utils
from flask import Blueprint, current_app, g, jsonify, request

from models.database import Adicionar_Nova_Aula, db
from service.turma_access import user_is_turma_admin


adicionar_nova_aula = Blueprint("adicionar_nova_aula", __name__)


@adicionar_nova_aula.route("/gerar_assinatura", methods=["GET"])
def gerar_assinatura():
    try:
        try:
            user_id = int(g.principal["sub"])
            admin_id = int(request.args.get("id_admin_turma", ""))
        except (KeyError, TypeError, ValueError):
            return jsonify({"erro": "Identificadores inválidos"}), 400
        nome_turma = request.args.get("nome_turma", "").strip()
        if not nome_turma or not user_is_turma_admin(user_id, admin_id, nome_turma):
            return jsonify({"erro": "Apenas o administrador da turma pode carregar aulas"}), 403

        cloud_name = (cloudinary.config().cloud_name or "").strip()
        api_key = cloudinary.config().api_key
        api_secret = cloudinary.config().api_secret
        if not cloud_name or not api_key or not api_secret:
            return jsonify({"erro": "Upload de aulas não configurado"}), 503

        timestamp = int(time.time())
        params = {
            "timestamp": timestamp,
            "folder": "video_aulas",
            "resource_type": "video",
        }
        return jsonify({
            "signature": cloudinary.utils.api_sign_request(params, api_secret),
            "timestamp": timestamp,
            "api_key": api_key,
            "cloud_name": cloud_name,
        }), 200
    except Exception:
        current_app.logger.exception("Falha ao gerar assinatura para aula")
        return jsonify({"erro": "Não foi possível preparar o upload"}), 500


@adicionar_nova_aula.route("/registrar_aula", methods=["POST"])
def registrar_aula():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"erro": "Dados inválidos"}), 400

        try:
            user_id = int(g.principal["sub"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"erro": "Sessão inválida"}), 401
        nome_turma = data.get("nome_turma")
        if not isinstance(nome_turma, str) or not nome_turma.strip() or len(nome_turma) > 100:
            return jsonify({"erro": "Turma inválida"}), 400
        nome_turma = nome_turma.strip()
        if not user_is_turma_admin(user_id, user_id, nome_turma):
            return jsonify({"erro": "Apenas o administrador da turma pode registar aulas"}), 403

        video_url = data.get("video_url")
        cloud_name = (cloudinary.config().cloud_name or "").strip()
        parsed_url = urlsplit(video_url if isinstance(video_url, str) else "")
        if (
            not cloud_name
            or parsed_url.scheme != "https"
            or parsed_url.netloc != "res.cloudinary.com"
            or not parsed_url.path.startswith(f"/{cloud_name}/video/upload/")
            or "video_aulas/" not in parsed_url.path
        ):
            return jsonify({"erro": "URL de vídeo inválido"}), 400

        tema_video = data.get("tema_video") or ""
        if not isinstance(tema_video, str) or len(tema_video) > 200:
            return jsonify({"erro": "Tema da aula inválido"}), 400
        nova_aula = Adicionar_Nova_Aula(
            nome_Turma=nome_turma,
            id_admin_Turma=user_id,
            tema_video=tema_video.strip(),
            video=video_url,
        )
        db.session.add(nova_aula)
        db.session.commit()
        return jsonify({"mensagem": "Aula registada com sucesso!"}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar aula")
        return jsonify({"erro": "Falha ao registar aula"}), 500
