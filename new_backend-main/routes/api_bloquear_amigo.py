from flask import Blueprint, g, request, jsonify
from models.database import Amigo , db

Bloquear_Usuario = Blueprint("bloquear_Usuario" , __name__)

@Bloquear_Usuario.route("/api/bloquear_amigo" , methods = ["POST"])
def bloquear_usuario():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"resposta": "Dados inválidos", "status": False}), 400
        id_usuario = int(g.principal["sub"])
        id_amigo = int(dados.get("id_amigo"))
        if id_usuario == id_amigo:
            return jsonify({"resposta": "Não podes bloquear a tua própria conta", "status": False}), 400

        bloquear_usuario = Amigo.query.filter(
            Amigo.id_usuario == id_usuario , 
            Amigo.id_amigo == id_amigo
        ).all()

        if not bloquear_usuario:
            return jsonify({"resposta":"nao ha nenuhum usuario para bloquear"})

        if not bloquear_usuario:
            return jsonify({"resposta": "Amizade não encontrada", "status": False}), 404
        amizade = bloquear_usuario[0]
        marker = f"bloquear_usuario_{id_usuario}"
        if amizade.condicao_estado_Bloqueado1 == marker:
            amizade.condicao_estado_Bloqueado1 = "none"
            blocked = False
        elif amizade.condicao_estado_Bloqueado2 == marker:
            amizade.condicao_estado_Bloqueado2 = "none"
            blocked = False
        elif amizade.condicao_estado_Bloqueado1 == "none":
            amizade.condicao_estado_Bloqueado1 = marker
            blocked = True
        elif amizade.condicao_estado_Bloqueado2 == "none":
            amizade.condicao_estado_Bloqueado2 = marker
            blocked = True
        else:
            return jsonify({"resposta": "Não foi possível actualizar o bloqueio", "status": False}), 409
        db.session.commit()
        return jsonify({"resposta": "Estado actualizado", "status": blocked})
    except (KeyError, TypeError, ValueError):
        return jsonify({"resposta": "Identificadores inválidos", "status": False}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"resposta": "Não foi possível actualizar o bloqueio", "status": False}), 500




