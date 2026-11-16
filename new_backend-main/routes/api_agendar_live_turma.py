from datetime import datetime, timezone

from flask import Blueprint, current_app, g, request, jsonify

from models.database import Agendar_Live_Turma, Turma_Aula, db
from service.turma_access import user_is_turma_admin


AgendarLiveTurma = Blueprint("AgendarLiveTurma", __name__)


@AgendarLiveTurma.route("/agendar_live_turma", methods=["POST"])
def agendar_live_turma():
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return jsonify({"resposta": "Dados inválidos"}), 400
    try:
        user_id = int(g.principal["sub"])
        nome_turma = dados.get("nome_Turma")
        sala_turma = dados.get("sala_Turma")
        data_hora = dados.get("data_hora_agenda_live")
        tema = dados.get("tema_agenda_live")
        if (not isinstance(nome_turma, str) or not nome_turma.strip() or len(nome_turma) > 120
                or not isinstance(sala_turma, str) or not sala_turma.strip() or len(sala_turma) > 200):
            return jsonify({"resposta": "Turma inválida"}), 400
        turma = Turma_Aula.query.filter_by(
            nome_Turma=nome_turma,
            sala_Turma=sala_turma,
            tipo_usuario_Turma="admin",
        ).first()
        if not turma or not user_is_turma_admin(user_id, int(turma.id_admin_Turma), nome_turma):
            return jsonify({"resposta": "Sem acesso a esta turma"}), 403
        if not isinstance(data_hora, str) or not isinstance(tema, str) or not tema.strip() or len(tema.strip()) > 200:
            return jsonify({"resposta": "Data ou tema inválido"}), 400
        scheduled_at = datetime.fromisoformat(data_hora.replace("Z", "+00:00"))
        if scheduled_at.tzinfo is None:
            return jsonify({"resposta": "A data deve incluir fuso horário"}), 400
        if scheduled_at <= datetime.now(timezone.utc):
            return jsonify({"resposta": "A live deve estar agendada no futuro"}), 400

        nova_agenda = Agendar_Live_Turma(
            nome_turma_agenda=nome_turma,
            sala_turma_agenda=sala_turma,
            data_hora_agenda_live=scheduled_at.astimezone(timezone.utc).isoformat(),
            id_aluno_turma_agenda_live=str(turma.id_admin_Turma),
            tema_agenda_live=tema.strip(),
            status_agenda_live="ativo",
        )
        db.session.add(nova_agenda)
        db.session.commit()
        return jsonify({"resposta": "Live agendada"}), 201
    except (KeyError, TypeError, ValueError):
        return jsonify({"resposta": "Sessão ou identificadores inválidos"}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao agendar live da turma")
        return jsonify({"resposta": "Não foi possível agendar a live"}), 500
