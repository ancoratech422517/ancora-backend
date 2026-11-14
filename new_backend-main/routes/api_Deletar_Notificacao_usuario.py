from flask import Blueprint, current_app, g, jsonify, request
from models.database import Amizade , db
Deletar_notificacao = Blueprint("Deletar_notificacao", __name__)

@Deletar_notificacao.route("/Deletar_Notificacao_usuario" , methods = ["post"])
def Deletar_Notificacao_usuario():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"status": "Dados inválidos"}), 400
        id_notificacao = int(dados.get("id_notificacao"))
        id_usuario = int(g.principal["sub"])
        tipo_notificacao = dados.get("tipo_notificacao")

        notificacao = Amizade.query.filter(
            Amizade.id == id_notificacao,
            Amizade.destinatario_id == id_usuario,
            Amizade.tipo_notificacao == tipo_notificacao,
        ).first()
        if not notificacao:
            return jsonify({"status": "Notificação não encontrada"}), 404
        db.session.delete(notificacao)
        db.session.commit()
        return jsonify({"status": "Notificação eliminada com sucesso"})
    
    except (TypeError, ValueError):
        return jsonify({"status": "Identificadores inválidos"}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao eliminar notificação")
        return jsonify({"status": "Não foi possível eliminar a notificação"}), 500


