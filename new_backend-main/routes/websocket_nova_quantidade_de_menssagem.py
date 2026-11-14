from flask_socketio import emit
from models.database import Menssagens, Amigo
from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("nova_quantidade_de_menssagem")
def nova_quantidade_de_menssagem(data):
    if not isinstance(data, dict):
        return
    usuario_id = get_user_id_from_cookie()
    nossa_sala = data.get("nossa_sala")
    if not usuario_id or not isinstance(nossa_sala, str):
        return
    amizade = Amigo.query.filter_by(
        id_usuario=int(usuario_id),
        nossa_sala=nossa_sala,
    ).first()
    if not amizade:
        return

    nova_quantidade_menssagem = Menssagens.query.filter_by(
        id_destinatario=amizade.id_amigo,
        nossa_sala=nossa_sala,
        lida=False,
    ).count()
    emit(
        "responsta_nova_quantidade_de_menssagem",
        {
            "quantidade_menssagem_nao_lida": nova_quantidade_menssagem,
            "id_amigo": int(usuario_id),
        },
        room=str(amizade.id_amigo),
    )

