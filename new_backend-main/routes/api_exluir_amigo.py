from flask import Blueprint, g, request, jsonify
from models.database import Amigo , db

Excluir_amigo = Blueprint("Exluir_amigo" , __name__)

@Excluir_amigo.route("/api/exluir_amigo" , methods = ["POST"])
def exluir_amigo():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"resposta": "Dados inválidos", "status": False}), 400
        id_usuario = int(g.principal["sub"])
        id_amigo = int(dados.get("id_amigo"))
        if id_usuario == id_amigo:
            return jsonify({"resposta": "Identificadores inválidos", "status": False}), 400

        Exluir_Amigo = Amigo.query.filter(
            Amigo.id_usuario == id_usuario , 
            Amigo.id_amigo   == id_amigo
        ).delete()
        db.session.commit()
        return jsonify({"resposta": "o seu amigo foi eliminado com sucesso", "status": True})
    except (KeyError, TypeError, ValueError):
        return jsonify({"resposta": "Identificadores inválidos", "status": False}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"resposta": "Não foi possível eliminar o contacto", "status": False}), 500


