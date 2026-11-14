from flask import Blueprint, current_app, g, jsonify
from service.api_usuarios import UserService

users_bp = Blueprint('users', __name__)

@users_bp.route('/usuarios/lista/<int:id_usuario>', methods=['GET'])
def listar_usuarios(id_usuario):
    if str(id_usuario) != g.principal["sub"]:
        return jsonify({"error": "Forbidden"}), 403

    try:
        usuarios = UserService.listar_todos_para_chat(
            usuario_logado_id=id_usuario
        )
        return jsonify(usuarios), 200
    except Exception:
        current_app.logger.exception("Failed to list users for chat")
        return jsonify({"error": "Unable to list users"}), 500
