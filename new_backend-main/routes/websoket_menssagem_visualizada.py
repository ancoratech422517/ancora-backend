from flask import current_app
from flask_socketio import emit
from models.database import Menssagens, db, Amigo
from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("menssagem_visualizada")
def menssagem_visualizada (data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Dados da conversa inválidos"}
    usuario_id = get_user_id_from_cookie()
    nossa_sala = data.get("nossa_sala")
    if not usuario_id or not isinstance(nossa_sala, str):
        return {"ok": False, "erro": "Conversa inválida"}
    amizade = Amigo.query.filter_by(
        id_usuario=int(usuario_id),
        nossa_sala=nossa_sala,
    ).first()
    if not amizade:
        return {"ok": False, "erro": "Sem acesso a esta conversa"}

    try:
        id_amigo = amizade.id_amigo
        meu_id = int(usuario_id)
        
        # 1. Marca como lidas TODAS as mensagens que enviaram PARA MIM nesta sala
        mensagens_para_marcar = Menssagens.query.filter_by(
            nossa_sala = nossa_sala,
            id_destinatario=meu_id,
            lida = False
        ).all()

        remetentes_notificar = {str(msg.id_remitente) for msg in mensagens_para_marcar}
        for msg in mensagens_para_marcar:
            msg.lida = True
        
        db.session.commit()
        emit("responsta_nova_quantidade_de_menssagem", {
            "quantidade_menssagem_nao_lida": 0,
            "id_amigo": id_amigo,
        }, room=str(meu_id))

        confirmacao = {
            "nossa_sala": nossa_sala,
            "lido_por": meu_id,
        }
        for id_remetente in remetentes_notificar:
            emit("confirmacao_leitura_remetente", confirmacao, room=id_remetente)

    except Exception as erro:
        db.session.rollback()
        current_app.logger.exception("Falha ao marcar mensagens como lidas: %s", erro)
    
    