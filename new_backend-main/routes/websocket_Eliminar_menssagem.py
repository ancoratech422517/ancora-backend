from flask import current_app
from flask_socketio import emit
from routes.websocket import socketio
from models.database import Menssagens, db, Amigo
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("Eliminar_menssagem")
def Eliminar_menssagem (data):
    if not isinstance(data, dict):
        return {"success": False, "error": "Dados da mensagem inválidos"}
    usuario_id = get_user_id_from_cookie()
    id_menssagem = data.get("id_menssagem")
    sala_menssagem = data.get("sala_menssagem")
    if not usuario_id or not isinstance(sala_menssagem, str):
        return {"success": False, "error": "Sessão ou conversa inválida"}
    try:
        message_id = int(id_menssagem)
        sender_id = int(usuario_id)
    except (TypeError, ValueError):
        return {"success": False, "error": "Identificador de mensagem inválido"}
    amizade = Amigo.query.filter_by(
        id_usuario=sender_id,
        nossa_sala=sala_menssagem,
    ).first()
    if not amizade:
        return {"success": False, "error": "Sem acesso a esta conversa"}
    mensagem = Menssagens.query.filter_by(
        nossa_sala=sala_menssagem,
        id=message_id,
        id_remitente=sender_id,
    ).first()
    if not mensagem:
        return {"success": False, "error": "Mensagem não encontrada ou sem permissão"}
    db.session.delete(mensagem)
    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        current_app.logger.exception("Falha ao apagar mensagem: %s", error)
        return {"success": False, "error": "Não foi possível apagar a mensagem"}

    emit(
        "elimiar_menssagem_array",
        {"id_menssagem": message_id, "sala_menssagem": sala_menssagem},
        room=sala_menssagem,
    )
    return {"success": True}
    