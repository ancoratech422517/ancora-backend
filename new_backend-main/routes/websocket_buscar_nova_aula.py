from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie
from service.turma_access import user_is_turma_member

@socketio.on("buscar_nova_aula")
def Buscar_Nova_Aula(dados):
    if not isinstance(dados, dict):
        return {"ok": False, "erro": "Dados da turma inválidos"}
    usuario_id = get_user_id_from_cookie()
    nome_turma = dados.get("nome_turma")
    try:
        id_admin_turma = int(dados.get("id_admin_turma"))
        usuario_id = int(usuario_id)
    except (TypeError, ValueError):
        return {"ok": False, "erro": "Turma ou sessão inválida"}
    if not isinstance(nome_turma, str) or not user_is_turma_member(
        usuario_id, id_admin_turma, nome_turma
    ):
        return {"ok": False, "erro": "Sem acesso a esta turma"}

    sala_turma = f"Turma_{id_admin_turma}_admin_{nome_turma.replace(' ', '_')}"
    socketio.emit(
        "nova_aula_enviada",
        {"nome_turma": nome_turma, "id_admin_turma": id_admin_turma},
        room=str(sala_turma),
    )
    return {"ok": True}
