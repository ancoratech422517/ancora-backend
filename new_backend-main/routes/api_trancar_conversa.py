from flask import Flask , Blueprint , request , jsonify
from models.database import Amigo , db
TrancarConversa = Blueprint("TrancarConversa" , __name__)

@TrancarConversa.route("/api/trancar_conversa" , methods = ["POST"])
def trancar_conversa():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")
        id_amigo = dados.get("id_amigo")
        estado_privado_usuario = dados.get("estado_privado_usuario")

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
                
    except Exception as erro:
        print(f"erro ao trancar a conversa:{erro}")
        return jsonify({"resposta":f"erro ao trancar a conversa:{erro}"})

