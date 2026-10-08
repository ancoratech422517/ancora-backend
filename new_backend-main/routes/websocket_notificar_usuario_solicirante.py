from routes.websocket import socketio

@socketio.on("notificar_usuario_solicirante")
def notificar_usuario_solicirante(data):
    id_usuario_solicitante = data.get("id_usuario_solicitante")
    id_admin_turma = data.get("id_admin_turma")
    id_turma = data.get("id_turma")

    # Emitir a notificação para o usuário solicitante
    socketio.emit(
        "notificacao_entrada_turma",
        {
            "mensagem": f"Seu pedido de entrada na turma foi aceito!",
            "id_turma": id_turma,
            "id_admin_turma": id_admin_turma
        },
        room=str(id_usuario_solicitante)
    )