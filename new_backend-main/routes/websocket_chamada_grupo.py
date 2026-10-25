from routes.websocket import socketio
from flask_socketio import join_room, leave_room
from routes.websoket_conectUser import (
    get_user_id_from_cookie,
    usuario_esta_na_sala,
    usuarios_online,
)
from models.database import Turma_Aula
from service.pushy_service import enviar_notificacao_pushy


def _sala_live(sala_turma):
    return f"live_turma:{sala_turma}"


@socketio.on("entrar_live_turma")
def entrar_live_turma(data):
    sala_turma = data.get("sala") if isinstance(data, dict) else None
    usuario_id = get_user_id_from_cookie()
    if not sala_turma or not usuario_id:
        return {"ok": False, "erro": "Sala ou utilizador não informado"}

    membros_turma = Turma_Aula.query.filter(
        Turma_Aula.sala_Turma == sala_turma
    ).all()
    eh_membro = any(
        str(membro.id_aluno_Turma) == str(usuario_id)
        or str(membro.id_admin_Turma) == str(usuario_id)
        for membro in membros_turma
    )
    if not eh_membro:
        return {"ok": False, "erro": "Utilizador não pertence a esta turma"}

    join_room(_sala_live(sala_turma))
    return {"ok": True}


@socketio.on("sair_live_turma")
def sair_live_turma(data):
    sala_turma = data.get("sala") if isinstance(data, dict) else None
    if not sala_turma or not get_user_id_from_cookie():
        return {"ok": False, "erro": "Sala ou utilizador não informado"}

    leave_room(_sala_live(sala_turma))
    return {"ok": True}


@socketio.on("chamada_grupo")
def chamada_grupo(data):
    try:
        salaTurma = data.get("sala")
        idRemitente = get_user_id_from_cookie()
        if not salaTurma or not idRemitente:
            return {"ok": False, "erro": "Sala ou remetente não informado"}

        nossa_sala = Turma_Aula.query.filter(
            Turma_Aula.sala_Turma == salaTurma
        ).all()
        if not nossa_sala:
            return {"ok": False, "erro": "Turma não encontrada"}

        eh_administrador = any(
            str(aluno.id_admin_Turma) == str(idRemitente)
            for aluno in nossa_sala
        )
        if not eh_administrador:
            return {"ok": True, "ignorada": True, "alunos_notificados": 0}

        sala_live = _sala_live(salaTurma)
        alunos_notificados = 0
        alunos_online = 0
        destinatarios_notificados = set()
        for aluno in nossa_sala:
            id_aluno = str(aluno.id_aluno_Turma or "").strip()
            if (
                not id_aluno
                or id_aluno.lower() == "none"
                or id_aluno == str(idRemitente)
                or id_aluno in destinatarios_notificados
            ):
                continue

            if usuario_esta_na_sala(id_aluno, sala_live):
                destinatarios_notificados.add(id_aluno)
                continue

            dados_sala = {
                "nome_turma": aluno.nome_Turma,
                "imagem_perfil_Turma": aluno.imagem_perfil_Turma,
                "sala_Turma": aluno.sala_Turma
            }
            online = bool(usuarios_online.get(id_aluno))
            if online:
                socketio.emit("turma_ligar_aluno", dados_sala, room=id_aluno)
                alunos_online += 1

            push_enviado = enviar_notificacao_pushy(
                id_aluno,
                f"Live iniciada: {aluno.nome_Turma}",
                f"Uma live começou na turma {aluno.nome_Turma}.",
                {
                    "type": "live_started",
                    "notification_type": "live_turma",
                    "room": salaTurma,
                    "sala_Turma": salaTurma,
                    "nome_turma": aluno.nome_Turma
                },
                sala_ativa=sala_live
            )
            destinatarios_notificados.add(id_aluno)
            if online or push_enviado:
                alunos_notificados += 1
        return {
            "ok": True,
            "alunos_online": alunos_online,
            "alunos_notificados": alunos_notificados
        }
    except Exception as erro:
        print(f"ouve um erro ao emitir a chamada para os alunos:{erro}")
        return {"ok": False, "erro": "Erro interno ao emitir a chamada"}