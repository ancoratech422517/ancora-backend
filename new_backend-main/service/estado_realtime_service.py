from flask import current_app

from models.database import Amigo
from routes.websocket import socketio
from service.pushy_service import enviar_notificacao_pushy


def notificar_amigos_novo_estado(estado):
    try:
        id_usuario = int(estado.id_usuario)
        amizades = Amigo.query.filter(
            (Amigo.id_usuario == id_usuario) | (Amigo.id_amigo == id_usuario)
        ).all()
        ids_amigos = {
            amizade.id_amigo if amizade.id_usuario == id_usuario else amizade.id_usuario
            for amizade in amizades
        }

        payload = {
            "id": estado.id,
            "id_usuario": id_usuario,
            "dados_estado": estado.dados_estado,
            "media_blurhash": estado.media_blurhash,
            "descricao_dados": estado.descricao_dados,
            "visualizacao_dados": estado.visualizacao_dados,
            "adoro_dados": estado.adoro_dados,
            "tipo_estado": estado.tipo_estado,
            "nome_usuario_estado": estado.nome_usuario_estado,
            "foto_usuario_estado": estado.foto_usuario_estado,
        }

        for id_amigo in ids_amigos:
            socketio.emit("novo_estado_amigo", payload, room=str(id_amigo))
            try:
                enviar_notificacao_pushy(
                    id_amigo,
                    f"{estado.nome_usuario_estado or 'Um amigo'} adicionou um novo estado",
                    "Toque para ver o novo estado.",
                    {
                        "type": "notification",
                        "notification_type": "novo_estado",
                        "sender_id": id_usuario,
                        "id_estado": estado.id,
                        "foto_usuario": estado.foto_usuario_estado,
                    },
                    enviar_para_online=True,
                )
            except Exception:
                current_app.logger.exception(
                    "Falha ao enviar push do novo estado ao amigo %s", id_amigo
                )
        return True
    except Exception:
        current_app.logger.exception("Falha ao notificar os amigos sobre um novo estado")
        return False
