from routes.websocket import socketio
from models.database import Turma_Aula
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("notificar_usuario_solicirante")
def notificar_usuario_solicirante(data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Dados da notificação inválidos"}
    usuario_autenticado = get_user_id_from_cookie()
    try:
        usuario_autenticado = int(usuario_autenticado)
        id_usuario_solicitante = int(data.get("id_usuario_solicitante"))
        id_admin_turma = int(data.get("id_admin_turma"))
        id_turma = int(data.get("id_turma"))
    except (TypeError, ValueError):
        return {"ok": False, "erro": "Identificadores inválidos"}

    turma = Turma_Aula.query.filter_by(
        id=id_turma,
        id_admin_Turma=id_admin_turma,
        tipo_usuario_Turma="admin",
    ).first()
    membro = Turma_Aula.query.filter_by(
        sala_Turma=turma.sala_Turma if turma else None,
        id_aluno_Turma=str(id_usuario_solicitante),
    ).first()
    if not turma or not membro:
        return {"ok": False, "erro": "A adesão à turma não foi confirmada"}
    if usuario_autenticado == id_admin_turma:
        destinatario_id = id_usuario_solicitante
        mensagem = "Seu pedido de entrada na turma foi aceite."
    elif usuario_autenticado == id_usuario_solicitante:
        destinatario_id = id_admin_turma
        mensagem = "O convite para a turma foi aceite."
    else:
        return {"ok": False, "erro": "Sem permissão para enviar esta notificação"}

    socketio.emit(
        "notificacao_entrada_turma",
        {
            "mensagem": mensagem,
            "id_turma": id_turma,
            "id_admin_turma": id_admin_turma
        },
        room=str(destinatario_id)
    )
    return {"ok": True}