from routes.websocket import socketio
from routes.websoket_conectUser import usuarios_online, get_user_id_from_cookie
from models.database import Turma_Aula




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

        alunos_notificados = 0
        alunos_online = 0
        for aluno in nossa_sala:
            id_aluno = str(aluno.id_aluno_Turma)
            if str(idRemitente) == id_aluno:
                continue

            dados_sala = {
                "nome_turma":aluno.nome_Turma,
                "imagem_perfil_Turma":aluno.imagem_perfil_Turma,
                "sala_Turma":aluno.sala_Turma
            }
            socketio.emit("turma_ligar_aluno", dados_sala, room=id_aluno)
            alunos_notificados += 1
            if usuarios_online.get(id_aluno):
                alunos_online += 1
        return {
            "ok": True,
            "alunos_online": alunos_online,
            "alunos_notificados": alunos_notificados
        }
    except Exception as erro:
        print(f"ouve um erro ao emitir a chamada para os alunos:{erro}")
        return {"ok": False, "erro": "Erro interno ao emitir a chamada"}