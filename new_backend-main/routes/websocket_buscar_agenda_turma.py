from routes.websocket import socketio
from flask_socketio import emit


@socketio.on("buscar_agenda_turma")
def buscar_agenda_turma(dados):
    try:
        nome_turma = dados.get("nome_turma")
        id_admin_turma = dados.get("id_admin_turma")
        novo_nome_turma = nome_turma.replace(" ","_")
        sala_turma = f"Turma_{id_admin_turma}_admin_{novo_nome_turma}"

        dados = {
            "nome_Turma":nome_turma,
            "id_admin_turma":id_admin_turma
        }

        print("nova agenda emitida com sucesso")

        emit("nova_agenda_turma" , dados , room = str(sala_turma))

    except Exception as erro:
  
        print(f"erro ao emitir a nova agenda:{erro}")
