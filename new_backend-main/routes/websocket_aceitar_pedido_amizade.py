from flask_socketio import emit, join_room
from routes.websocket import socketio
from models.database import db, Amigo, Amizade , Usuario


@socketio.on("aceitar_pedido_amizade")
def Aceitar_pedido_amizade(data):
    id_amigo = data.get("ID_destinatario")
    id_usuario = data.get("ID_remitente")
    nome_remitente = data.get("nome_remitente")
    foto_remitente = data.get("foto_remitente")
    foto_destinatario = data.get("foto_destinatario")


    if not id_amigo or not id_usuario:
        print("Erro: IDs inválidos recebidos")
        return

    try:
        id_usuario = int(id_usuario)
        id_amigo = int(id_amigo)
    except (TypeError, ValueError):
        print("Erro: IDs inválidos recebidos")
        return

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
    notificacao = Amizade.query.filter_by(
        remetente_id=id_usuario,
        destinatario_id=id_amigo
    ).first()

    if notificacao:
        db.session.delete(notificacao)
        db.session.commit()
        print("Notificação removida com sucesso!")
    else:
        # Tenta o inverso caso a ordem esteja trocada
        notificacao_inversa = Amizade.query.filter_by(
            remetente_id=id_amigo,
            destinatario_id=id_usuario
        ).first()
        if notificacao_inversa:
            db.session.delete(notificacao_inversa)
            db.session.commit()
            print("Notificação inversa removida!")

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
