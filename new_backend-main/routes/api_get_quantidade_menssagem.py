from flask import Blueprint, g, jsonify
from models.database import Amigo, Menssagens

quantidade_menssagem = Blueprint("quantidade_menssagem" , __name__)

@quantidade_menssagem.route("/buscar_quantidade_menssagem/<int:dadosUsuario_id>/<amigo_nossa_sala>" , methods = ["GET"])
def buscar_quantidade_menssagem(dadosUsuario_id , amigo_nossa_sala):
    if str(dadosUsuario_id) != g.principal["sub"]:
        return jsonify({"error": "Sem permissão para consultar estas mensagens"}), 403
    if not Amigo.query.filter_by(
        id_usuario=dadosUsuario_id,
        nossa_sala=amigo_nossa_sala,
    ).first():
        return jsonify({"error": "Conversa não encontrada"}), 404
    try:
        get_quantidade_menssagem = Menssagens.query.filter_by(
            id_destinatario = dadosUsuario_id , 
            nossa_sala = amigo_nossa_sala,
            lida = False

        ).count()

 
        return jsonify({"quantidade":get_quantidade_menssagem , "id_destinatario":dadosUsuario_id})
    except Exception as erro:
        print(f"erro ao buscar a quantidade de menssagem no banco de dados:{erro}")
       
    

    
