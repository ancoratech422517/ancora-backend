from flask import Blueprint, jsonify
from service.api_usuarios import UserService

users_bp = Blueprint('users', __name__)

@users_bp.route('/usuarios/lista/<int:id_usuario>', methods=['GET'])
def listar_usuarios(id_usuario):
    try:
    # Por enquanto retornamos todos
        usuarios = UserService.listar_todos_para_chat(usuario_logado_id=int(id_usuario)) 
        return jsonify(usuarios), 200
    except Exception as erro:
        print(f"erro ao buscar os usuarios registrado na ancora avelino:{erro}")
        
