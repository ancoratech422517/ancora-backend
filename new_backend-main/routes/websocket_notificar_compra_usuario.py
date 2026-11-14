from routes.websocket import socketio
from flask_socketio import emit
from flask import current_app
from models.database import Amizade, Pedidos_Produto, db
from service.pushy_service import enviar_notificacao_pushy
from datetime import datetime, timezone
from routes.websoket_conectUser import get_user_id_from_cookie

@socketio.on("notificar_compra_usuario")
def notificar_compra_usuario(data):
    if not isinstance(data, dict):
        return {"ok": False, "erro": "Dados da compra inválidos"}
    usuario_id = get_user_id_from_cookie()
    try:
        dados = data
        id_cliente = int(dados.get("id_cliente"))
        id_vendedor = int(dados.get("id_vendedor"))
        id_pedido = int(dados.get("id_pedido"))
        if int(usuario_id) != id_cliente:
            return {"ok": False, "erro": "Compra não pertence a esta sessão"}
        pedido = Pedidos_Produto.query.filter_by(
            id=id_pedido,
            id_cliente=id_cliente,
            id_vendedor=id_vendedor,
            pedido="meus_pedidos",
        ).first()
        if not pedido:
            return {"ok": False, "erro": "Pedido não encontrado"}
        preco = pedido.preco_produto
        imagem = pedido.imagem_produto
        nome_produto = pedido.nome_produto

        notificacao_cliente = Amizade.query.filter_by(
            id_produto=str(pedido.id),
            destinatario_id=id_cliente,
            tipo_notificacao="compra_produto_cliente",
        ).first()
        nova_notificacao_cliente = notificacao_cliente is None
        if not notificacao_cliente:
            notificacao_cliente = Amizade(
                remetente_id=id_vendedor,
                destinatario_id=id_cliente,
                tipo_notificacao="compra_produto_cliente",
                status="entregue",
                data_criacao=datetime.now(timezone.utc).replace(tzinfo=None),
                visualizada=False,
                preco_produto=preco,
                imagem_produto=imagem,
                nome_produto=nome_produto,
                id_produto=str(pedido.id),
            )
            db.session.add(notificacao_cliente)

        notificacao_vendedor = Amizade.query.filter_by(
            id_produto=str(pedido.id),
            destinatario_id=id_vendedor,
            tipo_notificacao="compra_produto_vendedor",
        ).first()
        nova_notificacao_vendedor = notificacao_vendedor is None
        if not notificacao_vendedor:
            notificacao_vendedor = Amizade(
                remetente_id=id_cliente,
                destinatario_id=id_vendedor,
                tipo_notificacao="compra_produto_vendedor",
                status="entregue",
                data_criacao=datetime.now(timezone.utc).replace(tzinfo=None),
                visualizada=False,
                preco_produto=preco,
                imagem_produto=imagem,
                nome_produto=nome_produto,
                id_produto=str(pedido.id),
            )
            db.session.add(notificacao_vendedor)

        db.session.commit()

        if nova_notificacao_cliente:
            enviar_notificacao_pushy(
                id_cliente,
                "Pedido recebido",
                f"Seu pedido de {nome_produto} foi registado.",
                {
                    "type": "notification",
                    "notification_type": "compra_produto_cliente",
                    "product_name": nome_produto
                }
            )
        if nova_notificacao_vendedor:
            enviar_notificacao_pushy(
                id_vendedor,
                "Novo pedido",
                f"Foi registado um pedido de {nome_produto}.",
                {
                    "type": "notification",
                    "notification_type": "compra_produto_vendedor",
                    "product_name": nome_produto
                }
            )

        emit("notificar_usuario_compra_produto", {
            "id": notificacao_cliente.id,
            "destinatario_id": id_cliente,
            "tipo_notificacao": "compra_produto_cliente",
            "nome_produto": nome_produto,
        }, room=str(id_cliente))
        emit("notificar_usuario_compra_produto", {
            "id": notificacao_vendedor.id,
            "destinatario_id": id_vendedor,
            "tipo_notificacao": "compra_produto_vendedor",
            "nome_produto": nome_produto,
        }, room=str(id_vendedor))
        return {"ok": True}

    except (TypeError, ValueError):
        return {"ok": False, "erro": "Identificadores inválidos"}
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao notificar compra")
        emit("notificar_usuario_compra_produto", {"erro": "Falha ao notificar a compra"})
        return {"ok": False, "erro": "Falha ao notificar a compra"}