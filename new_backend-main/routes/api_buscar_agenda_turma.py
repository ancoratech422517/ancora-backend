from flask import Blueprint, request, jsonify
from models.database import Agendar_Live_Turma
from sqlalchemy import desc
from datetime import datetime, timedelta

Buscar_Agenda_Turma = Blueprint("Buscar_Agenda_Turma", __name__)

@Buscar_Agenda_Turma.route("/buscar_agenda_turma/<nome_turma>/<id_admin_turma>", methods=["GET"])
def buscar_agenda_turma(nome_turma, id_admin_turma):
    
    Agendas = Agendar_Live_Turma.query.filter(
        Agendar_Live_Turma.nome_turma_agenda == nome_turma, 
        Agendar_Live_Turma.id_aluno_turma_agenda_live == id_admin_turma
    ).order_by(Agendar_Live_Turma.data_hora_agenda_live.desc()).all()

    if not Agendas:
        print("nenhuma agenda agendada nesta turma")
        return jsonify([])
    else:
        agora = datetime.now()
        
        meses = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                 "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
        
        Agenda_Turma = []
        
        for agenda in Agendas:
            try:
                data_live = datetime.fromisoformat(agenda.data_hora_agenda_live)
                
                # Define que uma live permanece 'ativa' por 2 horas após o horário de início
                limite_fim_live = data_live + timedelta(hours=2)
                
                # Formatação legível
                data_formatada = f"{data_live.day} de {meses[data_live.month]} às {data_live.strftime('%H.%M')}"
                
                # LÓGICA DE STATUS:
                # 1. Deve ser o mesmo dia
                # 2. Deve estar entre o horário de início e 2 horas após o início
                if data_live.date() == agora.date():
                    if data_live <= agora <= limite_fim_live:
                        status_final = "ativo"
                    # Caso seja futuro, mas ainda no mesmo dia, também consideramos 'ativo' para aparecer como opção
                    elif data_live > agora:
                        status_final = "ativo"
                    else:
                        status_final = agenda.status_agenda_live
                else:
                    status_final = agenda.status_agenda_live
            
            except (ValueError, TypeError):
                data_formatada = agenda.data_hora_agenda_live
                status_final = agenda.status_agenda_live

            item = {
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