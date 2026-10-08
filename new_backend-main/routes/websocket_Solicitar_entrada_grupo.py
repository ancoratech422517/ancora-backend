from flask import Flask , Blueprint
from routes.websocket import socketio
from models.database import Amizade , Turma_Aula , db


@socketio.on("Solicitar_entrada_grupo")
def solicitar_entrada_turma (dados):
    try:
        id_usuario_solicitante = int(dados.get("id_usuario_solicitante"))
        nome_usuario_solicitante = dados.get("nome_usuario_solicitante")
        foto_usuario_solicitante = dados.get("foto_usuario_solicitante")
        id_admin_turma = int(dados.get("id_admin_turma"))
        id_turma = int(dados.get("id_turma"))
        nome_turma = dados.get("nome_turma")

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
            return

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
            return

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
            return

        dados_solicitante_notificacao = {
            "remetente_id":id_usuario_solicitante,
            "destinatario_id":id_admin_turma,
            "tipo_notificacao":"solicitacao",
            "foto_usuario":foto_usuario_solicitante,
            "id_turma_convite":str(turma_admin.id),
            "nome_Turma":nome_turma
        }  
        

        nova_notificacao = Amizade(**dados_solicitante_notificacao)
        db.session.add(nova_notificacao)
        db.session.commit()

        socketio.emit("Resposta_Solicitacao_entrada_turma" , 
                      {
                          "nome_usuario_solicitante":nome_usuario_solicitante , 
                          "foto_usuario_solicitante":foto_usuario_solicitante , 
                          "id_usuario_solicitante":id_usuario_solicitante,
                          "id_turma":id_turma,
                          "id_admin_turma":id_admin_turma,
                          "nome_turma":nome_turma
                      } , room = str(id_admin_turma))
        
    except Exception as erro:
        print(f"erro ao fazer a solicitação de entrada na turma:{erro}")


