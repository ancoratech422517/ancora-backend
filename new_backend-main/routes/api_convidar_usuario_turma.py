from flask import Blueprint, current_app, g, request, jsonify
from models.database import Amizade, Turma_Aula, Usuario, db
from service.pushy_service import enviar_notificacao_pushy

Convidae_Usuario_Turma = Blueprint("Convidar_Usuario_Turma" , __name__)
@Convidae_Usuario_Turma.route("/convidar_usuario_turma" , methods = ["POST"])
def ConvidarUsuarioTurma():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"resposta": "Dados inválidos"}), 400
        id_usuario = int(g.principal["sub"])
        id_turma = int(dados.get("id_turma"))
        id_convidado = int(dados.get("id_convidado"))
        if id_usuario == id_convidado:
            return jsonify({"resposta": "Não pode convidar a si mesmo"}), 400

        dados_turma_actual = Turma_Aula.query.filter(
            Turma_Aula.id == id_turma,
            Turma_Aula.id_admin_Turma == id_usuario,
            Turma_Aula.tipo_usuario_Turma == "admin",
        ).first()
        convidado = db.session.get(Usuario, id_convidado)
        if not dados_turma_actual or not convidado:
            return jsonify({"resposta": "Turma ou utilizador não encontrado"}), 404

        turma_convite_existente = Amizade.query.filter(
            Amizade.id_turma_convite == str(id_turma),
            Amizade.destinatario_id == id_convidado,
            Amizade.tipo_notificacao == "convite_turma",
        ).first()
        

        if turma_convite_existente:
            print("vc ja fez um convite para este usuario")
            return jsonify({"resposta":"você já fez um convite para este usuario."})
        #verifica se o usuario já faz parte da turma
        ja_faz_parte = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(id_convidado),
            Turma_Aula.sala_Turma == dados_turma_actual.sala_Turma,
        ).first()
        if ja_faz_parte:
            print("este usuario já faz parte da turma")
            return jsonify({"resposta":"este usuario já faz parte da sua turma."})
        
        dados = {
            "destinatario_id":id_convidado,
            "remetente_id":id_usuario,
            "tipo_notificacao":"convite_turma",
            "foto_usuario":dados_turma_actual.imagem_perfil_Turma,
            "id_turma_convite":id_turma,
            "nome_Turma":dados_turma_actual.nome_Turma,
        }
        novo_pedido = Amizade(**dados)
        db.session.add(novo_pedido)
        db.session.commit()

        enviar_notificacao_pushy(
            id_convidado,
            "Novo convite para turma",
            f"Você foi convidado para a turma {dados_turma_actual.nome_Turma}.",
            {
                "type": "notification",
                "notification_type": "convite_turma",
                "sender_id": id_usuario,
                "id_turma": id_turma
            }
        )

        return jsonify({"resposta":"convite enviado"})
    
    except (TypeError, ValueError):
        return jsonify({"resposta": "Identificadores inválidos"}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao convidar utilizador para a turma")
        return jsonify({"resposta":"erro"}), 500
    
    
