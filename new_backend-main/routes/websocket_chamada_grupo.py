from urllib.parse import urlencode
from uuid import UUID

from routes.websocket import socketio
from flask_socketio import join_room, leave_room
from routes.websoket_conectUser import (
    get_user_id_from_cookie,
    usuario_esta_na_sala,
    usuarios_online,
)
from models.database import Amigo, Turma_Aula, Usuario, db
from service.pushy_service import FRONTEND_PUBLIC_URL, enviar_notificacao_pushy


def _sala_live(sala_turma):
    return f"live_turma:{sala_turma}"


def _amizade_ativa(id_usuario, id_amigo):
    amizade = Amigo.query.filter(
        ((Amigo.id_usuario == id_usuario) & (Amigo.id_amigo == id_amigo))
        | ((Amigo.id_usuario == id_amigo) & (Amigo.id_amigo == id_usuario))
    ).first()
    if not amizade:
        return None

    bloqueios = {
        f"bloquear_usuario_{id_usuario}",
        f"bloquear_usuario_{id_amigo}",
    }
    if bloqueios.intersection({
        amizade.condicao_estado_Bloqueado1,
        amizade.condicao_estado_Bloqueado2,
    }):
        return None
    return amizade


def _identificar_sala_chamada(data):
    if not isinstance(data, dict):
        return None, None
    try:
        call_id = str(UUID(str(data.get("call_id"))))
    except (TypeError, ValueError, AttributeError):
        return None, None

    room_name = f"voice-{call_id}"
    if data.get("room_name") != room_name:
        return None, None
    return call_id, room_name


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


@socketio.on("chamada_voz_iniciar")
def chamada_voz_iniciar(data):
    id_remetente = get_user_id_from_cookie()
    if not id_remetente:
        return {"ok": False, "erro": "Sessão expirada"}

    call_id, room_name = _identificar_sala_chamada(data)
    id_destinatario = data.get("recipient_id") if isinstance(data, dict) else None
    if not call_id or id_destinatario is None or str(id_destinatario) == str(id_remetente):
        return {"ok": False, "erro": "Destinatário ou chamada inválidos"}

    if not _amizade_ativa(id_remetente, id_destinatario):
        return {"ok": False, "erro": "Não é possível ligar para este usuário"}

    remetente = db.session.get(Usuario, id_remetente)
    destinatario = db.session.get(Usuario, id_destinatario)
    if not remetente or not destinatario:
        return {"ok": False, "erro": "Usuário não encontrado"}

    convite = {
        "call_id": call_id,
        "room_name": room_name,
        "caller_id": str(id_remetente),
        "caller_name": remetente.nome,
        "caller_photo": remetente.foto_usuario,
    }
    if usuarios_online.get(str(id_destinatario)):
        socketio.emit("chamada_voz_recebida", convite, room=str(id_destinatario))
        return {"ok": True, "delivery": "socket"}

    query = urlencode({
        "voice_call_id": call_id,
        "voice_room": room_name,
        "voice_caller": str(id_remetente),
        "voice_caller_name": remetente.nome,
    })
    push_enviado = enviar_notificacao_pushy(
        id_destinatario,
        f"{remetente.nome} está ligando",
        "Toque para atender à chamada de voz.",
        {
            "type": "voice_call",
            "notification_type": "chamada_voz",
            "sender_id": str(id_remetente),
            **convite,
            "url": f"{FRONTEND_PUBLIC_URL.rstrip('/')}/?{query}",
        },
    )
    if not push_enviado:
        return {
            "ok": False,
            "erro": "O usuário está offline e não foi possível enviar a notificação de chamada",
        }
    return {"ok": True, "delivery": "push"}


@socketio.on("responder_chamada_voz")
def responder_chamada_voz(data):
    id_destinatario = get_user_id_from_cookie()
    if not id_destinatario:
        return {"ok": False, "erro": "Sessão expirada"}

    call_id, room_name = _identificar_sala_chamada(data)
    id_remetente = data.get("caller_id") if isinstance(data, dict) else None
    resposta = data.get("response") if isinstance(data, dict) else None
    if (
        not call_id
        or id_remetente is None
        or resposta not in {"accepted", "rejected"}
        or not _amizade_ativa(id_remetente, id_destinatario)
    ):
        return {"ok": False, "erro": "Resposta de chamada inválida"}

    if usuarios_online.get(str(id_remetente)):
        outro_usuario = db.session.get(Usuario, id_destinatario)
        socketio.emit(
            "chamada_voz_status",
            {
                "call_id": call_id,
                "room_name": room_name,
                "status": resposta,
                "peer_id": str(id_destinatario),
                "peer_name": outro_usuario.nome if outro_usuario else "Usuário",
            },
            room=str(id_remetente),
        )
    return {"ok": True}


@socketio.on("encerrar_chamada_voz")
def encerrar_chamada_voz(data):
    id_remetente = get_user_id_from_cookie()
    call_id, room_name = _identificar_sala_chamada(data)
    id_destinatario = data.get("peer_id") if isinstance(data, dict) else None
    if (
        not id_remetente
        or not call_id
        or id_destinatario is None
        or not _amizade_ativa(id_remetente, id_destinatario)
    ):
        return {"ok": False, "erro": "Encerramento de chamada inválido"}

    if usuarios_online.get(str(id_destinatario)):
        socketio.emit(
            "chamada_voz_status",
            {
                "call_id": call_id,
                "room_name": room_name,
                "status": "ended",
                "peer_id": str(id_remetente),
            },
            room=str(id_destinatario),
        )
    return {"ok": True}