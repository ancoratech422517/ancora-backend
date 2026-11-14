from routes.websocket import socketio
from flask_socketio import emit
from models.database import Amizade
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("convidar_usuario_turma")
def convidar_usuario_turma(dados):
    if not isinstance(dados, dict):
        return {"ok": False, "erro": "Convite inválido"}
    usuario_id = get_user_id_from_cookie()
    try:
        usuario_id = int(usuario_id)
        id_turma = int(dados.get("id_turma"))
        id_convidado = int(dados.get("id_convidado"))
    except (TypeError, ValueError):
        return {"ok": False, "erro": "Identificadores inválidos"}
    if str(dados.get("id_usuario")) != str(usuario_id):
        return {"ok": False, "erro": "Sessão inválida"}

    convite = Amizade.query.filter_by(
        remetente_id=usuario_id,
        destinatario_id=id_convidado,
        id_turma_convite=str(id_turma),
        tipo_notificacao="convite_turma",
        status="pendente",
    ).first()
    if not convite:
        return {"ok": False, "erro": "Convite não encontrado"}

    emit(
        "convite_turma",
        {
            "id_usuario": usuario_id,
            "id_turma": id_turma,
            "id_convidado": id_convidado,
        },
        room=str(id_convidado),
    )
    return {"ok": True}
    