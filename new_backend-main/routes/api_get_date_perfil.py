from flask import Blueprint, g, jsonify
from service.api_get_date_perfil_service import date_perfil
date_perfil_user = Blueprint("data_perfil", __name__)


@date_perfil_user.route("/api/getDatePerfil", methods=["POST"])
def api_get_date_pergil():
    try:
        usuario_id = int(g.principal["sub"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"menssagem": "Sessão inválida"}), 401
    return date_perfil.dataPerfil(usuario_id)

