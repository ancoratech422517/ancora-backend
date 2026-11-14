from flask import Blueprint, current_app, g, request, jsonify
from models.database import Turma_Aula, db, Amizade, Usuario

Aceitar_Convite_Turma = Blueprint("Aceitar_Convite_Turma" , __name__)

@Aceitar_Convite_Turma.route("/aceitar_convite_turma" , methods = ["POST"])
def aceitar_convite_turma():
    try:
        dados = request.get_json()
        if not isinstance(dados, dict):
            return jsonify({"resposta": "erro", "erro": "Dados invalidos."}), 400

        try:
            id_turma_convite = int(dados.get("id_turma_convite"))
            id_usuario = int(dados.get("id_usuario"))
            id_admin = int(dados.get("id_admin"))
            id_notificacao = int(dados.get("id_notificacao"))
            authenticated_user_id = int(g.principal["sub"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"resposta": "erro", "erro": "Identificadores inválidos."}), 400
        tipo_notificacao = dados.get("tipo_notificacao")

        if tipo_notificacao not in ("convite_turma", "solicitacao"):
            return jsonify({"resposta": "erro", "erro": "Tipo de notificacao invalido."}), 400

        turma = db.session.get(Turma_Aula, id_turma_convite)
        if not turma:
            return jsonify({"resposta": "erro", "erro": "Turma nao encontrada."}), 404
        if int(turma.id_admin_Turma) != id_admin:
            return jsonify({"resposta": "erro", "erro": "Administrador da turma invalido."}), 403

        if tipo_notificacao == "convite_turma":
            if authenticated_user_id != id_usuario:
                return jsonify({"resposta": "erro", "erro": "Convite não pertence a esta sessão."}), 403
            destinatario_id = authenticated_user_id
            remetente_id = id_admin
            membro_id = authenticated_user_id
        else:
            if authenticated_user_id != id_admin:
                return jsonify({"resposta": "erro", "erro": "Apenas o administrador pode aceitar a solicitação."}), 403
            destinatario_id = authenticated_user_id
            remetente_id = id_usuario
            membro_id = id_usuario

        notificacao = Amizade.query.filter(
            Amizade.id == id_notificacao,
            Amizade.remetente_id == remetente_id,
            Amizade.destinatario_id == destinatario_id,
            Amizade.id_turma_convite == str(id_turma_convite),
            Amizade.tipo_notificacao == tipo_notificacao,
            Amizade.status == "pendente",
        ).first()
        if not notificacao:
            return jsonify({"resposta": "erro", "erro": "Notificacao nao encontrada."}), 404

        if not db.session.get(Usuario, membro_id):
            return jsonify({"resposta": "erro", "erro": "Utilizador não encontrado."}), 404
        membro_existente = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(membro_id),
            Turma_Aula.sala_Turma == turma.sala_Turma
        ).first()
        if not membro_existente:
            db.session.add(Turma_Aula(
                id_aluno_Turma=str(membro_id),
                sala_Turma=turma.sala_Turma,
                id_admin_Turma=turma.id_admin_Turma,
                tipo_usuario_Turma="aluno",
                nome_Turma=turma.nome_Turma
            ))


        db.session.delete(notificacao)
        db.session.commit()
        return jsonify({"resposta": "sucesso"}), 200
    
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao aceitar convite ou solicitação da turma")
        return jsonify({"resposta": "erro", "erro": "Falha ao aceitar convite/solicitacao."}), 500
    

