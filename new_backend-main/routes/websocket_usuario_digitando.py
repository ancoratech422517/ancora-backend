from routes.websocket import socketio 
from flask_socketio import emit
from models.database import Amigo
from routes.websoket_conectUser import get_user_id_from_cookie
from service.friend_access import users_are_unblocked_friends

@socketio.on("digitando")
def handle_digitando(data):
    if not isinstance(data, dict):
        return
    usuario_id = get_user_id_from_cookie()
    id_destinatario = data.get("id_destinatario")
    if not usuario_id:
        return
    try:
        id_remitente = int(usuario_id)
        id_destinatario = int(id_destinatario)
    except (TypeError, ValueError):
        return
    amizade = Amigo.query.filter_by(
        id_usuario=id_remitente,
        id_amigo=id_destinatario,
    ).first()
    if not amizade or not users_are_unblocked_friends(id_remitente, id_destinatario):
        return
    esta_digitando = data.get("digitando") is True
    ultima_menssagem = data.get("ultima_menssagem", "")
    if not isinstance(ultima_menssagem, str):
        ultima_menssagem = ""
    ultima_menssagem = ultima_menssagem[:500]

    nossa_sala = amizade.nossa_sala

    emit("usuario_digitando", {
        "id_remitente": id_remitente,
        "digitando": esta_digitando,
        "nossa_sala":nossa_sala,
        "ultima_menssagem":ultima_menssagem
    }, room=str(id_destinatario))
