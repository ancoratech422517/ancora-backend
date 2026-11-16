import time

from flask import current_app, request
from flask_socketio import join_room, emit, disconnect
from routes.websocket import socketio
from models.database import Amizade, db, Amigo, Usuario
from service.pushy_service import enviar_notificacao_pushy
from ancorashield.exceptions import AuthenticationError
from service.security_audit import record_security_event
from service.security_tokens import access_token_manager
from service.lifecycle_cleanup import registrar_saida_socket

# Dicionário global: { usuario_id: socket_sid }
usuarios_online = {}
usuarios_por_sid = {}


def usuario_esta_na_sala(usuario_id, sala):
    sid = usuarios_online.get(str(usuario_id))
    return bool(
        sid
        and str(sala) in socketio.server.rooms(sid, namespace="/")
    )


def get_user_id_from_cookie():
    return usuarios_por_sid.get(request.sid)


def disconnect_expired_socket(sid, expires_at):
    socketio.sleep(max(0, expires_at - time.time()))
    socketio.server.disconnect(sid, namespace="/")

@socketio.on('connect')
def handle_connect(auth=None):
    token = auth.get("token") if isinstance(auth, dict) else None
    try:
        claims = access_token_manager().verify(token)
        usuario_id = int(claims["sub"])
        if claims.get("token_type") != "access" or "user" not in claims["roles"]:
            raise AuthenticationError("Token não autorizado para sockets.")
    except (AuthenticationError, KeyError, TypeError, ValueError):
        record_security_event("socket.access_denied", {})
        return False

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario:
        record_security_event("socket.access_denied", {"user_id": usuario_id})
        return False

    usuario_id_str = str(usuario_id)
    usuarios_por_sid[request.sid] = usuario_id_str
    usuarios_online[usuario_id_str] = request.sid
    join_room(usuario_id_str)
    record_security_event("socket.connected", {"user_id": usuario_id})
    emit("usuario_status_alterado", {
        "usuario_id": usuario_id_str,
        "status": "online"
    }, broadcast=True)

    socketio.start_background_task(
        disconnect_expired_socket,
        request.sid,
        claims["exp"],
    )
    return True

@socketio.on('autenticar')
def handle_autenticar():
    usuario_id = get_user_id_from_cookie()
    if not usuario_id:
        return {"ok": False, "erro": "Sessão não autenticada"}
    return {"ok": True, "usuario_id": usuario_id}

@socketio.on('disconnect')
def handle_disconnect():
    registrar_saida_socket(request.sid)
    usuario_id_desconectado = usuarios_por_sid.pop(request.sid, None)
    if usuario_id_desconectado:
        era_ultima_sessao = usuarios_online.get(usuario_id_desconectado) == request.sid
        if era_ultima_sessao:
            del usuarios_online[usuario_id_desconectado]
        record_security_event(
            "socket.disconnected",
            {"user_id": int(usuario_id_desconectado)},
        )
        if era_ultima_sessao:
            emit("usuario_status_alterado", {
                "usuario_id": usuario_id_desconectado,
                "status": "offline",
            }, broadcast=True)

@socketio.on("enviar_pedido_de_amizade")
def enviar_pedido_de_amizade(data):
    id_remitente = get_user_id_from_cookie()
    if not id_remitente:
        emit("erro_operacao", {"msg": "Sessão expirada"}, room=request.sid)
        return disconnect()
    
    if not isinstance(data, dict):
        return emit("erro_operacao", {"msg": "Dados inválidos"}, room=request.sid)
    try:
        id_destinatario = int(data.get("id_destinatario"))
        id_remitente_int = int(id_remitente)
    except (TypeError, ValueError):
        return emit("erro_operacao", {"msg": "Destinatário inválido"}, room=request.sid)

    remetente = db.session.get(Usuario, id_remitente_int)
    destinatario = db.session.get(Usuario, id_destinatario)
    if not remetente or not destinatario:
        return emit("erro_operacao", {"msg": "Utilizador não encontrado"}, room=request.sid)
    nome_remitente = remetente.nome
    foto_usuario = remetente.foto_usuario

    if id_remitente_int == id_destinatario:
        return emit("erro_operacao", {"msg": "Não pode add a si mesmo"}, room=request.sid)

    try:
        amigo_existente = Amigo.query.filter(
            ((Amigo.id_amigo == id_destinatario) & (Amigo.id_usuario == id_remitente_int)) |
            ((Amigo.id_amigo == id_remitente_int) & (Amigo.id_usuario == id_destinatario))
        ).first()

        if amigo_existente:
            return emit("erro_operacao", {"msg": "Vocês já são amigos"}, room=request.sid)

        existente = Amizade.query.filter(
            ((Amizade.remetente_id == id_remitente_int) & (Amizade.destinatario_id == id_destinatario)) |
            ((Amizade.remetente_id == id_destinatario) & (Amizade.destinatario_id == id_remitente_int)),
            Amizade.tipo_notificacao == "pedido_amizade",
            Amizade.status == "pendente"
        ).first()

        if existente:
            return emit("erro_operacao", {"msg": "Já existe uma solicitação"}, room=request.sid)

        novo_pedido = Amizade(
            remetente_id=id_remitente_int,
            destinatario_id=id_destinatario,
            status='pendente',
            foto_usuario=foto_usuario,
            tipo_notificacao="pedido_amizade"
        )
        db.session.add(novo_pedido)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao processar pedido de amizade")
        return emit(
            "erro_operacao",
            {"msg": "Não foi possível enviar o pedido de amizade. Tente novamente."},
            room=request.sid,
        )

    enviar_notificacao_pushy(
        id_destinatario,
        "Novo pedido de amizade",
        f"{nome_remitente} quer ser seu amigo",
        {
            "type": "notification",
            "notification_type": "pedido_amizade",
            "sender_id": id_remitente_int
        },
        enviar_para_online=True
    )

    emit("receber_notificacao", {
        "id": novo_pedido.id,
        "de_id": id_remitente_int,
        "nome_remetente": nome_remitente,
        "mensagem": f"{nome_remitente} quer ser seu amigo",
        "tipo_notificacao": "pedido_amizade",
        "foto_usuario": foto_usuario,
        "status": "pendente"
    }, room=str(id_destinatario))
    
    emit("sucesso_operacao", {"msg": "Pedido enviado"}, room=request.sid)
