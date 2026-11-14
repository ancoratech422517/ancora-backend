from routes.websocket import socketio
from flask import current_app
from models.database import Amizade, Turma_Aula, Usuario, db
from routes.websoket_conectUser import get_user_id_from_cookie
from service.pushy_service import enviar_notificacao_pushy


@socketio.on("Solicitar_entrada_grupo")
def solicitar_entrada_turma(dados):
    if not isinstance(dados, dict):
        return {"ok": False, "erro": "Dados da solicitação inválidos"}
    usuario_id = get_user_id_from_cookie()
    try:
        id_usuario_solicitante = int(usuario_id)
        id_admin_turma = int(dados.get("id_admin_turma"))
        id_turma = int(dados.get("id_turma"))
    except (TypeError, ValueError):
        return {"ok": False, "erro": "Sessão ou identificadores inválidos"}

    usuario = db.session.get(Usuario, id_usuario_solicitante)
    if not usuario or id_usuario_solicitante == id_admin_turma:
        return {"ok": False, "erro": "Utilizador inválido"}

    try:
        turma_referencia = Turma_Aula.query.filter(
            Turma_Aula.id == id_turma,
            Turma_Aula.id_admin_Turma == id_admin_turma,
        ).first()
        if not turma_referencia:
            return

        turma_admin = Turma_Aula.query.filter(
            Turma_Aula.tipo_usuario_Turma == "admin",
            Turma_Aula.sala_Turma == turma_referencia.sala_Turma,
            Turma_Aula.id_admin_Turma == id_admin_turma
        ).first()
        if not turma_admin:
            return {"ok": False, "erro": "Turma não encontrada"}

        membro_existente = Turma_Aula.query.filter(
            Turma_Aula.sala_Turma == turma_admin.sala_Turma,
            Turma_Aula.id_aluno_Turma == str(id_usuario_solicitante)
        ).first()
        if membro_existente:
            socketio.emit(
                "Resposta_Solicitacao_entrada_turma",
                {"resposta": "já faz parte desta turma", "dados": []},
                room=str(id_usuario_solicitante)
            )
            return {"ok": False, "erro": "Já pertence a esta turma"}

        solicitacao_existente = Amizade.query.filter(
            Amizade.remetente_id == id_usuario_solicitante,
            Amizade.destinatario_id == id_admin_turma,
            Amizade.tipo_notificacao == "solicitacao",
            Amizade.id_turma_convite.in_([
                str(turma_admin.id),
                str(id_turma)
            ])
        ).first()
        if solicitacao_existente:
            socketio.emit(
                "Resposta_Solicitacao_entrada_turma",
                {"resposta": "você já solicitou entrada nesta turma", "dados": []},
                room=str(id_usuario_solicitante)
            )
            return {"ok": False, "erro": "Solicitação já enviada"}

        dados_solicitante_notificacao = {
            "remetente_id":id_usuario_solicitante,
            "destinatario_id":id_admin_turma,
            "tipo_notificacao":"solicitacao",
            "foto_usuario":usuario.foto_usuario,
            "id_turma_convite":str(turma_admin.id),
            "nome_Turma":turma_admin.nome_Turma
        }  
        

        nova_notificacao = Amizade(**dados_solicitante_notificacao)
        db.session.add(nova_notificacao)
        db.session.commit()

        enviar_notificacao_pushy(
            id_admin_turma,
            "Nova solicitação para entrar na turma",
            f"{usuario.nome} quer entrar na turma {turma_admin.nome_Turma}",
            {
                "type": "notification",
                "notification_type": "solicitacao",
                "sender_id": id_usuario_solicitante,
                "id_turma": id_turma,
                "foto_usuario": usuario.foto_usuario,
                "foto_remitente": usuario.foto_usuario,
            }
        )

        socketio.emit("Resposta_Solicitacao_entrada_turma" , 
                      {
                          "nome_usuario_solicitante":usuario.nome,
                          "foto_usuario_solicitante":usuario.foto_usuario,
                          "id_usuario_solicitante":id_usuario_solicitante,
                          "id_turma":id_turma,
                          "id_admin_turma":id_admin_turma,
                          "nome_turma":turma_admin.nome_Turma
                      } , room = str(id_admin_turma))
        return {"ok": True}
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao solicitar entrada na turma")
        return {"ok": False, "erro": "Não foi possível enviar a solicitação"}

