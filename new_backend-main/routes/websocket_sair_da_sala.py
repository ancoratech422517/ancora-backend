from flask_socketio import leave_room
from routes.websocket import socketio
from models.database import Amigo
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("sair_da_sala")
def sair_da_sala(data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Dados da conversa inválidos"}
    usuario_id = get_user_id_from_cookie()
    nossa_sala = data.get("nossa_sala")
    if not usuario_id or not isinstance(nossa_sala, str):
        return {"ok": False, "erro": "Conversa inválida"}
    if not Amigo.query.filter_by(
        id_usuario=int(usuario_id),
        nossa_sala=nossa_sala,
    ).first():
        return {"ok": False, "erro": "Sem acesso a esta conversa"}

    leave_room(nossa_sala)
    socketio.emit("usuario_saiu_da_sala", room=nossa_sala)
    return {"ok": True}
