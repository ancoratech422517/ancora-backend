from flask_socketio import emit
from routes.websocket import socketio
from models.database import Menssagens , db

@socketio.on("Eliminar_menssagem")
def Eliminar_menssagem (data):
    id_menssagem = data.get("id_menssagem")
    sala_menssagem = data.get("sala_menssagem")
    id_remitente = data.get("id_remitente")
    Menssagens.query.filter(
        Menssagens.nossa_sala == sala_menssagem,
        Menssagens.id == id_menssagem
    ).delete()
    
    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        print(f"erro ao apagar a mensagem: {error}")
        return {"success": False, "error": "Não foi possível apagar a mensagem"}
    print(f"menssagem apagada com sucesso na sala {sala_menssagem}")

    emit("elimiar_menssagem_array" , {"id_menssagem":id_menssagem , "sala_menssagem":sala_menssagem} , room = str(sala_menssagem))
    return {"success": True}
    