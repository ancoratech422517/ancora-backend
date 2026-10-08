from routes.websocket import socketio 
from flask_socketio import emit

@socketio.on("digitando")
def handle_digitando(data):
    id_destinatario = data.get("id_destinatario")
    id_remitente = data.get("id_remitente")
    esta_digitando = data.get("digitando") # True ou False
    ultima_menssagem = data.get("ultima_menssagem")

    ordenar_sala = sorted([int(id_remitente) , int(id_destinatario)])
    nossa_sala = f"sala_{ordenar_sala[0]}_{ordenar_sala[1]}"

    # Enviamos para a sala do destinatário
    emit("usuario_digitando", {
        "id_remitente": id_remitente,
        "digitando": esta_digitando,
        "nossa_sala":nossa_sala,
        "ultima_menssagem":ultima_menssagem
    }, room=str(id_destinatario))