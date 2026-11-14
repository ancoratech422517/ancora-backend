from flask_socketio import emit
from routes.websocket import socketio
from models.database import db, Amigo, Amizade , Usuario
from routes.websoket_conectUser import get_user_id_from_cookie


@socketio.on("aceitar_pedido_amizade")
def Aceitar_pedido_amizade(data):
    if not isinstance(data, dict):
        return
    usuario_autenticado = get_user_id_from_cookie()
    id_amigo = data.get("ID_destinatario")
    if not usuario_autenticado or not id_amigo:
        print("Erro: IDs inválidos recebidos")
        return

    try:
        id_usuario = int(usuario_autenticado)
        id_amigo = int(id_amigo)
    except (TypeError, ValueError):
        print("Erro: IDs inválidos recebidos")
        return
    if id_usuario == id_amigo:
        return

    usuario = db.session.get(Usuario, id_usuario)
    amigo = db.session.get(Usuario, id_amigo)
    if not usuario or not amigo:
        return
    pedido_pendente = Amizade.query.filter_by(
        remetente_id=id_amigo,
        destinatario_id=id_usuario,
        tipo_notificacao="pedido_amizade",
        status="pendente",
    ).first()
    if not pedido_pendente:
        return {"ok": False, "erro": "Pedido de amizade não encontrado"}
    nome_remitente = usuario.nome
    foto_remitente = usuario.foto_usuario
    foto_destinatario = amigo.foto_usuario

    # Ordenar para criar sala única
    ordernar_sala = sorted([id_usuario, id_amigo])
    nossa_sala = f"sala_{ordernar_sala[0]}_{ordernar_sala[1]}"
    

    # Repara relações unidirecionais antigas sem duplicar relações existentes.
    amizades_existentes = Amigo.query.filter(
        ((Amigo.id_usuario == id_usuario) & (Amigo.id_amigo == id_amigo)) |
        ((Amigo.id_usuario == id_amigo) & (Amigo.id_amigo == id_usuario))
    ).all()
    pares_existentes = {
        (amizade.id_usuario, amizade.id_amigo)
        for amizade in amizades_existentes
    }

    novas_amizades = []
    if (id_usuario, id_amigo) not in pares_existentes:
        novas_amizades.append(Amigo(
            id_usuario=id_usuario,
            id_amigo=id_amigo,
            foto_amigo=foto_destinatario,
            nossa_sala=nossa_sala,
        ))
    if (id_amigo, id_usuario) not in pares_existentes:
        novas_amizades.append(Amigo(
            id_usuario=id_amigo,
            id_amigo=id_usuario,
            foto_amigo=foto_remitente,
            nossa_sala=nossa_sala,
        ))

    if novas_amizades:
        db.session.add_all(novas_amizades)
        db.session.commit()
        print(f"Amizade registada com sucesso na sala: {nossa_sala}")

    # Remover notificação da tabela Amizade (pedido de amizade)
    db.session.delete(pedido_pendente)
    db.session.commit()

    # Emitir respostas para ambos
    emit("response_aceitar_pedido_amizade", {
        "menssagem": f"{nome_remitente} aceitou o seu pedido de amizade",
        "nossa_sala": nossa_sala
    }, room=str(id_amigo))

    emit("response_aceitar_pedido_amizade", {
        "menssagem": "O usuário já foi notificado!",
        "nossa_sala": nossa_sala
    }, room=str(id_usuario))

    print("Processo de aceitação de amizade finalizado.")
