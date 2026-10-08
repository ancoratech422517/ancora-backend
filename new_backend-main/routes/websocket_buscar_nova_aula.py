from routes.websocket import socketio
from flask_socketio import emit

@socketio.on("buscar_nova_aula")
def Buscar_Nova_Aula(dados):
    nome_turma = dados.get("nome_turma")
    id_admin_turma = dados.get("id_admin_turma")
    novo_nome_turma = nome_turma.replace(" " , "_")
    sala_turma = f"Turma_{id_admin_turma}_admin_{novo_nome_turma}"

    dados = {
        "nome_turma":nome_turma,
        "id_admin_turma":id_admin_turma
    }

    socketio.emit("nova_aula_enviada" , dados , room = str(sala_turma))
