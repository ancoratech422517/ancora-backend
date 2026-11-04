from flask import Blueprint , request , jsonify
from models.database import Amigo , db

Excluir_amigo = Blueprint("Exluir_amigo" , __name__)

@Excluir_amigo.route("/api/exluir_amigo" , methods = ["POST"])
def exluir_amigo():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")
        id_amigo = dados.get("id_amigo")

        Exluir_Amigo = Amigo.query.filter(
            Amigo.id_usuario == id_usuario , 
            Amigo.id_amigo   == id_amigo
        ).delete()
        db.session.commit()
        return jsonify({"resposta":"o seu amigo foi eliminado com sucesso" , "status":True})
    except Exception as erro:
        print(f"erro ao tentar exluir o seu amigo:{erro}")
        return jsonify({"resposta":f"ouve um erro ao tentar exluir este usuario:{erro}" , "status":False})


