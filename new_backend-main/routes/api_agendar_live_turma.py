from flask import Blueprint , request , jsonify
from models.database import Agendar_Live_Turma , db

AgendarLiveTurma = Blueprint("AgendarLiveTurma" , __name__)
@AgendarLiveTurma.route("/agendar_live_turma" , methods = ["POST"])
def agendar_live_turma():
    try:
        dados = request.get_json()
        nome_Turma = dados.get("nome_Turma")
        sala_Turma = dados.get("sala_Turma")
        data_hora_agendar_live = dados.get("data_hora_agenda_live")
        id_usuario_agendar_live = dados.get("id_usuario")
        tema_agendar_live = dados.get("tema_agenda_live")

        dados_agenda = {
            "nome_turma_agenda":nome_Turma,
            "sala_turma_agenda":sala_Turma,
            "data_hora_agenda_live":data_hora_agendar_live,
            "id_aluno_turma_agenda_live":id_usuario_agendar_live,
            "tema_agenda_live":tema_agendar_live
        }
        nova_agenda = Agendar_Live_Turma(**dados_agenda)
        db.session.add(nova_agenda)
        db.session.commit()
        return jsonify({"resposta":"boas avelino"})
    except Exception as erro:
        print(f"erro ao fazer a agenda avelino:{erro}")
        return jsonify({"resposta":"erro ao fazer a agenda"})

