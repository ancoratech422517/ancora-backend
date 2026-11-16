from flask import Blueprint, g, jsonify
from models.database import Agendar_Live_Turma
from datetime import datetime, timedelta, timezone
from sqlalchemy import or_
from service.turma_access import user_is_turma_member

Buscar_Agenda_Turma = Blueprint("Buscar_Agenda_Turma", __name__)

@Buscar_Agenda_Turma.route("/buscar_agenda_turma/<nome_turma>/<id_admin_turma>", methods=["GET"])
def buscar_agenda_turma(nome_turma, id_admin_turma):
    try:
        user_id = int(g.principal["sub"])
        admin_id = int(id_admin_turma)
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Sessão ou turma inválida"}), 401
    if not user_is_turma_member(user_id, admin_id, nome_turma):
        return jsonify({"error": "Sem acesso a esta turma"}), 403

    Agendas = Agendar_Live_Turma.query.filter(
        Agendar_Live_Turma.nome_turma_agenda == nome_turma, 
        Agendar_Live_Turma.id_aluno_turma_agenda_live == str(admin_id),
        or_(
            Agendar_Live_Turma.live_vazia_em.is_(None),
            Agendar_Live_Turma.live_vazia_em > datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10),
        ),
    ).order_by(Agendar_Live_Turma.data_hora_agenda_live.desc()).all()

    if not Agendas:
        print("nenhuma agenda agendada nesta turma")
        return jsonify([])
    else:
        meses = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                 "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
        
        Agenda_Turma = []
        
        for agenda in Agendas:
            try:
                data_live = datetime.fromisoformat(
                    (agenda.data_hora_agenda_live or "").replace("Z", "+00:00")
                )
                if data_live.tzinfo is None:
                    data_live = data_live.replace(tzinfo=timezone.utc)
                data_local = data_live.astimezone()
                data_formatada = (
                    f"{data_local.day} de {meses[data_local.month]} "
                    f"às {data_local.strftime('%H.%M')}"
                )
            except (ValueError, TypeError):
                data_formatada = agenda.data_hora_agenda_live

            # Agendar uma live torna a sala disponível; o horário não deve
            # finalizá-la automaticamente antes de o administrador a encerrar.
            status_final = "ativo"

            item = {
                "id_agenda_live": agenda.id,
                "nome_turma_agenda": agenda.nome_turma_agenda,
                "id_admin_turma_agenda": agenda.id_aluno_turma_agenda_live,
                "data_hora_agenda_live": agenda.data_hora_agenda_live,
                "data_formatada": data_formatada,
                "status_agenda_live": status_final,
                "tema_agenda_live": agenda.tema_agenda_live,
                "sala_turma_agenda": agenda.sala_turma_agenda
            }
            Agenda_Turma.append(item)
            
        return jsonify(Agenda_Turma)
