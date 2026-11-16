from flask import request
from flask_socketio import emit
import json
from models.database import Menssagens, Registrar_produto, Amigo
from routes.websocket import socketio
from routes.websoket_conectUser import get_user_id_from_cookie
from service.friend_access import users_are_unblocked_friends

@socketio.on("buscar_menssagens")
def buscar_menssagens(data):
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
    if not users_are_unblocked_friends(int(usuario_id), int(amizade.id_amigo)):
        return {"ok": False, "erro": "Esta conversa está bloqueada"}

    buscar_menssagem_na_sala = Menssagens.query.filter(Menssagens.nossa_sala == nossa_sala).all()
    lista_menssagem = []
    dados_users = {
        "id_remitente": usuario_id,
        "id_destinatario": amizade.id_amigo,
    }
    try:  
        for menssagem in buscar_menssagem_na_sala:
            conteudo_menssagem = menssagem.menssagem
            if menssagem.file_url:
                try:
                    payload_arquivo = json.loads(conteudo_menssagem)
                    if not isinstance(payload_arquivo, dict):
                        payload_arquivo = {}
                except (TypeError, ValueError):
                    payload_arquivo = {}

                resource_type = payload_arquivo.get("resourceType")
                file_url = (menssagem.file_url or "").lower()
                for candidate in ("image", "video", "raw"):
                    if f"/{candidate}/upload/" in file_url:
                        resource_type = candidate
                        break

                if resource_type not in ("image", "video", "raw"):
                    resource_type = "raw"
                    if (menssagem.mime_type or "").startswith("image/"):
                        resource_type = "image"
                    elif (menssagem.mime_type or "").startswith("video/"):
                        resource_type = "video"

                payload_arquivo.update({
                    "isFile": True,
                    "fileUrl": menssagem.file_url,
                    "publicId": menssagem.public_id,
                    "fileName": menssagem.file_name,
                    "mimeType": menssagem.mime_type,
                    "fileSize": menssagem.file_size or 0,
                    "resourceType": resource_type
                })
                conteudo_menssagem = json.dumps(payload_arquivo, ensure_ascii=False)

            lista_menssagem.append({
            "id":menssagem.id,
            "nossa_sala": menssagem.nossa_sala,
            "menssagem": conteudo_menssagem,
            "id_remitente": menssagem.id_remitente,
            "nome_remitente": menssagem.nome_remitente,
            "id_destinatario":menssagem.id_destinatario,
            "nome_destinatario":menssagem.nome_destinatario,
            "data_envio":menssagem.data_envio,
            "lida":menssagem.lida , 
            "tipo":menssagem.tipo or "texto",
            "file_url":menssagem.file_url,
            "public_id":menssagem.public_id,
            "file_name":menssagem.file_name,
            "mime_type":menssagem.mime_type,
            "file_size":menssagem.file_size,
            "reply_to_id":menssagem.reply_to_id,
            "reply_to_menssagem":menssagem.reply_to_menssagem,
            "reply_to_nome":menssagem.reply_to_nome,
            "client_message_id":menssagem.client_message_id
            })
        # buscar os produtos dos participantes da conversa
        get_product_user_destinatario = Registrar_produto.query.filter(
             Registrar_produto.id_usuario == dados_users["id_destinatario"]
         )
        get_product_user_remitente = Registrar_produto.query.filter(
             Registrar_produto.id_usuario == dados_users["id_remitente"]
         )
        lista_produto_usuario_destinatario = []
        for lista_produto_user in get_product_user_destinatario:
            lista_produto_usuario_destinatario.append({
                "nome_produto":lista_produto_user.nome_produto,
                "descricao_produto":lista_produto_user.descricao_produto,
                "tipo_produto":lista_produto_user.tipo_produto,
                "preco_produto":lista_produto_user.preco_produto,
                "url_imagem_produto":lista_produto_user.url_imagem_produto,
                "id_usuario":lista_produto_user.id_usuario
                
            })
        lista_produto_usuario_remitente = []
        for lista_produto_user_destinatario in get_product_user_remitente:
            lista_produto_usuario_remitente.append({
                "nome_produto":lista_produto_user_destinatario.nome_produto,
                "descricao_produto":lista_produto_user_destinatario.descricao_produto,
                "tipo_produto":lista_produto_user_destinatario.tipo_produto,
                "preco_produto":lista_produto_user_destinatario.preco_produto,
                "url_imagem_produto":lista_produto_user_destinatario.url_imagem_produto,
                "id_usuario":lista_produto_user_destinatario.id_usuario
                
            })

          

        emit("minhas_menssagens", lista_menssagem, to=request.sid)
        emit(
            "lista_produto_usuario_chat",
            lista_produto_usuario_destinatario,
            room=str(dados_users["id_remitente"]),
        )
        emit(
            "lista_produto_usuario_chat",
            lista_produto_usuario_remitente,
            room=str(dados_users["id_destinatario"]),
        )
    except Exception as erro:
        print(f"erro ao buscar as menssagens:{erro}")


  
