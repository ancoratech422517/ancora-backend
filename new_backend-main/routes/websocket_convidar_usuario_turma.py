from routes.websocket import socketio
from flask_socketio import emit

@socketio.on("convidar_usuario_turma")
def convidar_usuario_turma(dados):
    print(f"avelino , os dados chegaram:{dados}")
    try:
        id_usuario = dados.get("id_usuario")
        id_turma = dados.get("id_turma")
        id_convidado = dados.get("id_convidado")

        dados = {
            "id_usuario":id_usuario,
            "id_turma":id_turma,
            "id_convidado":id_convidado
        }

        emit("convite_turma" , dados , room = str(id_convidado))
    except Exception as erro:
        emit("convite_turma" , {"resposta":f"erro ao emitir o pedido:{erro}"} , room = str(id_convidado))



    