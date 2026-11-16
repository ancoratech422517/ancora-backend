from flask_socketio import join_room, emit, leave_room
from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie
from models.database import Amigo
from service.friend_access import users_are_unblocked_friends

@socketio.on("Entrar_na_sala")
def Entrar_na_sala(data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Dados da conversa inválidos"}

    usuario_id = get_user_id_from_cookie()
    sala = data.get("nossa_sala")
    if not usuario_id or not isinstance(sala, str):
        return {"ok": False, "erro": "Conversa inválida"}

    amizade = Amigo.query.filter_by(
        id_usuario=int(usuario_id),
        nossa_sala=sala,
    ).first()
    if not amizade:
        return {"ok": False, "erro": "Sem acesso a esta conversa"}
    if not users_are_unblocked_friends(int(usuario_id), int(amizade.id_amigo)):
        return {"ok": False, "erro": "Esta conversa está bloqueada"}

    sala_antiga = data.get("sala_antiga")
    if isinstance(sala_antiga, str) and sala_antiga and sala_antiga != sala:
        antiga_autorizada = Amigo.query.filter_by(
            id_usuario=int(usuario_id),
            nossa_sala=sala_antiga,
        ).first()
        if antiga_autorizada and users_are_unblocked_friends(
            int(usuario_id), int(antiga_autorizada.id_amigo)
        ):
            leave_room(sala_antiga)

    join_room(sala)
    emit("usuario_conectado_na_sala", room=sala)
    return {"ok": True}
