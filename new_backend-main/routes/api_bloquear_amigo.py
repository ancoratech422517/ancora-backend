from flask import Blueprint , request , jsonify
from models.database import Amigo , db

Bloquear_Usuario = Blueprint("bloquear_Usuario" , __name__)

@Bloquear_Usuario.route("/api/bloquear_amigo" , methods = ["POST"])
def bloquear_usuario():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")
        id_amigo = dados.get("id_amigo")
        estado_bloqueado_usuario = dados.get("estado_bloqueado_usuario")

        bloquear_usuario = Amigo.query.filter(
            Amigo.id_usuario == id_usuario , 
            Amigo.id_amigo == id_amigo
        ).all()

        if not bloquear_usuario:
            return jsonify({"resposta":"nao ha nenuhum usuario para bloquear"})

        if bloquear_usuario:
            for bloquear in bloquear_usuario:
                if bloquear.condicao_estado_Bloqueado1 == "none":
                    bloquear.condicao_estado_Bloqueado1 = f"bloquear_usuario_{id_usuario}"
                    db.session.commit()
                    return jsonify({"resposta":"boas , usuario bloqueado com suceeo" , "status":True})

                elif bloquear.condicao_estado_Bloqueado2 == "none" and bloquear.condicao_estado_Bloqueado1 != f"bloquear_usuario_{id_usuario}" :
                    bloquear.condicao_estado_Bloqueado2 = f"bloquear_usuario_{id_usuario}"
                    db.session.commit()
                    return jsonify({"resposta":"boas , usuario bloqueado com suceeo" , "status":True})
                
                elif bloquear.condicao_estado_Bloqueado1 == f"bloquear_usuario_{id_usuario}":
                    bloquear.condicao_estado_Bloqueado1 = "none"
                    db.session.commit()
                    return jsonify({"resposta":"boas , usuario bloqueado com suceeo" , "status":False})
                
                elif bloquear.condicao_estado_Bloqueado2 == f"bloquear_usuario_{id_usuario}":
                    bloquear.condicao_estado_Bloqueado2 = "none"
                    db.session.commit()
                    return jsonify({"resposta":"boas , usuario bloqueado com suceeo" , "status":False})
                else:
                    return jsonify({"resposta":"nenhum usuario para bloquear" , "status":False})
    except Exception as erro:
        print(f"erro ao bloquear o usuario:{erro}")
        return jsonify({"resposta":f"erro ao tentar bloquear o usuario:{erro}" , "status":False})




