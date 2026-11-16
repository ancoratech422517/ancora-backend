from models.database import Menssagens, db, Amigo
from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie
from service.friend_access import users_are_unblocked_friends


@socketio.on("editar_menssagem")
def Editar_menssagem(data):
    if not isinstance(data, dict):
        return {"success": False, "error": "Dados da edição inválidos"}

    id_menssagem = data.get("id_menssagem")
    sala_menssagem = data.get("sala_menssagem")
    novo_conteudo = data.get("novo_conteudo")
    usuario_id = get_user_id_from_cookie()
    if not usuario_id:
        return {"success": False, "error": "Sessão expirada. Inicie sessão novamente"}
    if not id_menssagem or not sala_menssagem:
        return {"success": False, "error": "Mensagem ou conversa inválida"}
    if not isinstance(sala_menssagem, str):
        return {"success": False, "error": "Mensagem ou conversa inválida"}
    if not isinstance(novo_conteudo, str) or not novo_conteudo.strip():
        return {"success": False, "error": "A mensagem não pode ficar vazia"}
    try:
        id_menssagem = int(id_menssagem)
        usuario_id = int(usuario_id)
    except (TypeError, ValueError):
        return {"success": False, "error": "Identificador de mensagem inválido"}

    amizade = Amigo.query.filter_by(
        id_usuario=usuario_id,
        nossa_sala=sala_menssagem,
    ).first()
    if not amizade or not users_are_unblocked_friends(usuario_id, int(amizade.id_amigo)):
        return {"success": False, "error": "Sem acesso a esta conversa"}
    if len(novo_conteudo) > 10_000:
        return {"success": False, "error": "A mensagem excede o limite permitido"}

    editar_menssagem = Menssagens.query.filter(
        Menssagens.id == id_menssagem , 
        Menssagens.nossa_sala == sala_menssagem,
        Menssagens.id_remitente == usuario_id
    ).first()

    if not editar_menssagem:
        return {"success": False, "error": "Mensagem não encontrada ou sem permissão para editar"}

    editar_menssagem.menssagem = novo_conteudo
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"success": False, "error": "Não foi possível guardar a mensagem"}

    socketio.emit(
        "editar_menssagem_array",
        {
            "id_menssagem": editar_menssagem.id,
            "sala_menssagem": editar_menssagem.nossa_sala,
            "novo_conteudo": editar_menssagem.menssagem
        },
        room=str(editar_menssagem.nossa_sala),
        include_self=True
    )
    return {"success": True}
