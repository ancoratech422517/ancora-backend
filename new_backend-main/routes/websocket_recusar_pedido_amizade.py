from flask_socketio import emit
from routes.websocket import socketio
from models.database import db, Amizade
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("recusar_pedido_amizade")
def Recusar_pedido_amizade(data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Pedido inválido"}
    usuario_id = get_user_id_from_cookie()
    try:
        usuario_id = int(usuario_id)
        id_remetente = int(data.get("id_destinatario"))
    except (TypeError, ValueError):
        return {"ok": False, "erro": "Identificadores inválidos"}

    notificacao = Amizade.query.filter_by(
        remetente_id=id_remetente,
        destinatario_id=usuario_id,
        tipo_notificacao="pedido_amizade",
        status="pendente",
    ).first()
    if not notificacao:
        return {"ok": False, "erro": "Pedido de amizade não encontrado"}

    db.session.delete(notificacao)
    db.session.commit()
    emit(
        "response_aceitar_pedido_amizade",
        {"menssagem": "usuario regeitado"},
        room=str(id_remetente),
    )
    return {"ok": True}

