from models.database import Turma_Aula , db , Amizade
from flask import Blueprint , request , jsonify

Aceitar_Convite_Turma = Blueprint("Aceitar_Convite_Turma" , __name__)

@Aceitar_Convite_Turma.route("/aceitar_convite_turma" , methods = ["POST"])
def aceitar_convite_turma():
    try:
        dados = request.get_json()
        if not isinstance(dados, dict):
            return jsonify({"resposta": "erro", "erro": "Dados invalidos."}), 400

        id_turma_convite = dados.get("id_turma_convite")
        id_usuario = dados.get("id_usuario")
        id_admin = dados.get("id_admin")
        id_notificacao = dados.get("id_notificacao")
        tipo_notificacao = dados.get("tipo_notificacao")

        if not all(value is not None for value in (id_turma_convite, id_usuario, id_admin, id_notificacao)):
            return jsonify({"resposta": "erro", "erro": "Faltam dados para aceitar."}), 400
        if tipo_notificacao not in ("convite_turma", "solicitacao"):
            return jsonify({"resposta": "erro", "erro": "Tipo de notificacao invalido."}), 400

        turma = Turma_Aula.query.filter(
            Turma_Aula.id == int(id_turma_convite)
        ).first()
        if not turma:
            return jsonify({"resposta": "erro", "erro": "Turma nao encontrada."}), 404
        if str(turma.id_admin_Turma) != str(id_admin):
            return jsonify({"resposta": "erro", "erro": "Administrador da turma invalido."}), 403

        destinatario_id = id_admin if tipo_notificacao == "solicitacao" else id_usuario
        notificacao = Amizade.query.filter(
            Amizade.id == id_notificacao,
            Amizade.destinatario_id ==int( destinatario_id),
            Amizade.id_turma_convite == str(id_turma_convite),
            Amizade.tipo_notificacao == tipo_notificacao
        ).first()
        if not notificacao:
            return jsonify({"resposta": "erro", "erro": "Notificacao nao encontrada."}), 404

        membro_existente = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(id_usuario),
            Turma_Aula.sala_Turma == turma.sala_Turma
        ).first()
        if not membro_existente:
            db.session.add(Turma_Aula(
                id_aluno_Turma=str(id_usuario),
                sala_Turma=turma.sala_Turma,
                id_admin_Turma=turma.id_admin_Turma,
                tipo_usuario_Turma="aluno",
                nome_Turma=turma.nome_Turma
            ))

        db.session.delete(notificacao)
        db.session.commit()
        return jsonify({"resposta": "sucesso"}), 200
    
    except Exception as erro:
        db.session.rollback()
        print(f"erro ao aceitar convite/solicitacao:{erro}")
        return jsonify({"resposta": "erro", "erro": "Falha ao aceitar convite/solicitacao."}), 500
    

