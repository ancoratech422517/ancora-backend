from flask import Blueprint, g, request, jsonify
from models.database import Amigo , db
TrancarConversa = Blueprint("TrancarConversa" , __name__)

@TrancarConversa.route("/api/trancar_conversa" , methods = ["POST"])
def trancar_conversa():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"resposta": "Dados inválidos"}), 400
        id_usuario = int(g.principal["sub"])
        id_amigo = int(dados.get("id_amigo"))
        if id_usuario == id_amigo:
            return jsonify({"resposta": "Identificadores inválidos"}), 400

        filtrar_amigo = Amigo.query.filter(
            Amigo.id_amigo == id_amigo , 
            Amigo.id_usuario == id_usuario,
            
        ).all()

        if not filtrar_amigo:
            return jsonify({"resposta":"nenuhm amigo encontrado"})
        
        if filtrar_amigo:
            for meu_amigo in filtrar_amigo:

                if meu_amigo.condicao_estado_Trancar1 == "normal":
                    meu_amigo.condicao_estado_Trancar1 = f"Trancar_id_usuario_{id_usuario}"
                    db.session.commit()
                    return jsonify({"resposta":"estado actualizado com sucesso" , "estado_privado":True})

                elif meu_amigo.condicao_estado_Trancar2 == "normal" and meu_amigo.condicao_estado_Trancar1 != f"Trancar_id_usuario_{id_usuario}" :
                    meu_amigo.condicao_estado_Trancar2 = f"Trancar_id_usuario_{id_usuario}"
                    db.session.commit()
                    return jsonify({"resposta":"estado actualizado com sucesso" , "estado_privado":True})

                elif meu_amigo.condicao_estado_Trancar1 == f"Trancar_id_usuario_{id_usuario}":
                    meu_amigo.condicao_estado_Trancar1 = "normal"
                    db.session.commit()
                    return jsonify({"resposta":"estado actualizado com sucesso" , "estado_privado":False})

                elif meu_amigo.condicao_estado_Trancar2 == f"Trancar_id_usuario_{id_usuario}":
                    meu_amigo.condicao_estado_Trancar2 = "normal"
                    db.session.commit()
                    return jsonify({"resposta":"estado actualizado com sucesso" , "estado_privado":False})
                
    except (KeyError, TypeError, ValueError):
        return jsonify({"resposta": "Identificadores inválidos"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"resposta": "Não foi possível actualizar a privacidade da conversa"}), 500

