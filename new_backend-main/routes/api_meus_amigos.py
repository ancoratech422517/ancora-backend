from flask import Blueprint, g, jsonify
from service.api_meus_amigos_service import Meus_amigos
meus_amigos = Blueprint("meus_amigos" , __name__)

@meus_amigos.route("/api/get/meus_amigos/<int:usuario_id>" , methods = ["GET"])
def Get_meus_amigos (usuario_id):
    if str(usuario_id) != g.principal["sub"]:
        return jsonify({"error": "Sem permissão para consultar esta lista"}), 403
    resultado = Meus_amigos.Listar_todos_meus_amigos(usuario_id)
    
    return resultado


