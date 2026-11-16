from flask_socketio import join_room, leave_room, emit
from routes.websocket import socketio
from datetime import datetime 
import json
import os
from urllib.parse import urlsplit
from models.database import Menssagens, db, Amigo, Usuario
from service.pushy_service import enviar_notificacao_pushy
from sqlalchemy.exc import IntegrityError
from routes.websoket_conectUser import get_user_id_from_cookie
from service.friend_access import users_are_unblocked_friends

@socketio.on("enviar_menssagem_na_sala")
def enviar_menssagem_na_sala(data):
    if not isinstance(data, dict):
        return {"success": False, "error": "Dados da mensagem inválidos"}

    authenticated_user_id = get_user_id_from_cookie()
    if not authenticated_user_id:
        return {"success": False, "error": "Sessão expirada"}

    agora = datetime.now()
    horario_formatado = agora.strftime("%H:%M") 

    nossa_sala = data.get("nossa_sala")
    if not isinstance(nossa_sala, str) or not nossa_sala:
        return {"success": False, "error": "Conversa inválida"}
    amizade = Amigo.query.filter_by(
        id_usuario=int(authenticated_user_id),
        nossa_sala=nossa_sala,
    ).first()
    if not amizade:
        return {"success": False, "error": "Sem acesso a esta conversa"}
    if not users_are_unblocked_friends(int(authenticated_user_id), int(amizade.id_amigo)):
        return {"success": False, "error": "Esta conversa está bloqueada"}

    usuario = db.session.get(Usuario, int(authenticated_user_id))
    amigo = db.session.get(Usuario, amizade.id_amigo)
    if not usuario or not amigo:
        return {"success": False, "error": "Utilizador da conversa não encontrado"}

    menssagem = data.get("menssagem")
    if (
        not isinstance(menssagem, str)
        or not menssagem.strip()
        or len(menssagem) > 900_000
    ):
        return {"success": False, "error": "Mensagem vazia ou demasiado grande"}
    id_remitente = usuario.id
    nome_remitente = usuario.nome
    foto_remitente = usuario.foto_usuario
    id_amigo = amigo.id
    nome_amigo = amigo.nome
    client_message_id = str(data.get("client_message_id") or "").strip()[:80] or None
    if client_message_id:
        existing_message = Menssagens.query.filter_by(
            client_message_id=client_message_id
        ).first()
        if existing_message:
            if (
                str(existing_message.id_remitente) != str(id_remitente)
                or str(existing_message.nossa_sala) != str(nossa_sala)
            ):
                return {"success": False, "error": "Identificador de mensagem já utilizado"}
            return {
                "success": True,
                "mensagem_id": existing_message.id,
                "client_message_id": client_message_id
            }
    dados_resposta = data.get("reply_to")
    if not isinstance(dados_resposta, dict):
        dados_resposta = {}
    mensagem_original = None
    reply_to_id = None
    reply_to_texto = None
    reply_to_nome = None

    try:
        reply_to_id = int(dados_resposta.get("id"))
    except (TypeError, ValueError):
        reply_to_id = None

    if reply_to_id is not None:
        mensagem_original = Menssagens.query.filter_by(
            id=reply_to_id,
            nossa_sala=nossa_sala
        ).first()

    if mensagem_original:
        reply_to_nome = mensagem_original.nome_remitente
        if mensagem_original.file_url:
            reply_to_texto = mensagem_original.file_name or "Ficheiro"
        elif (mensagem_original.menssagem or "").startswith("data:audio"):
            reply_to_texto = "Mensagem de áudio"
        elif "giphy.com" in (mensagem_original.menssagem or ""):
            reply_to_texto = "GIF"
        else:
            try:
                conteudo_original = json.loads(mensagem_original.menssagem)
                if isinstance(conteudo_original, dict) and conteudo_original.get("isFile"):
                    reply_to_texto = conteudo_original.get("fileName") or "Ficheiro"
            except (TypeError, ValueError):
                pass
            if reply_to_texto is None:
                reply_to_texto = (mensagem_original.menssagem or "")[:500]

    dados_arquivo = {}
    try:
        conteudo = json.loads(menssagem)
    except (TypeError, ValueError):
        conteudo = None

    if isinstance(conteudo, dict) and conteudo.get("isFile"):
        file_url = conteudo.get("fileUrl")
        public_id = conteudo.get("publicId")
        file_name = conteudo.get("fileName")
        mime_type = conteudo.get("mimeType")
        resource_type = conteudo.get("resourceType")
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
        parsed_url = urlsplit(file_url if isinstance(file_url, str) else "")
        try:
            tamanho_arquivo = int(conteudo.get("fileSize") or 0)
        except (TypeError, ValueError):
            tamanho_arquivo = 0
        if (
            not cloud_name
            or parsed_url.scheme != "https"
            or parsed_url.netloc != "res.cloudinary.com"
            or parsed_url.query
            or parsed_url.fragment
            or (not isinstance(resource_type, str) or resource_type not in {"image", "video", "raw"})
            or not parsed_url.path.startswith(f"/{cloud_name}/{resource_type}/upload/")
            or not isinstance(public_id, str)
            or not public_id.strip()
            or len(public_id) > 255
            or not isinstance(file_name, str)
            or not file_name.strip()
            or len(file_name) > 255
            or not isinstance(mime_type, str)
            or len(mime_type) > 255
            or tamanho_arquivo <= 0
            or tamanho_arquivo > 256 * 1024 * 1024
        ):
            return {"success": False, "error": "Anexo inválido"}

        dados_arquivo = {
            "tipo": "arquivo",
            "file_url": file_url,
            "public_id": public_id,
            "file_name": file_name,
            "mime_type": mime_type or "application/octet-stream",
            "file_size": tamanho_arquivo,
        }
    elif not menssagem.startswith("data:audio") and len(menssagem) > 10_000:
        return {"success": False, "error": "A mensagem excede o limite permitido"}
    dados = {
        "nossa_sala": nossa_sala,
        "menssagem": menssagem,
        "id_remitente": id_remitente,
        "nome_remitente": nome_remitente,
        "id_destinatario": id_amigo,
        "nome_destinatario": nome_amigo,
        "data_envio": horario_formatado,
        "lida": False, 
        "tipo": dados_arquivo.get("tipo", "texto"),
        "reply_to_id": mensagem_original.id if mensagem_original else None,
        "reply_to_menssagem": reply_to_texto,
        "reply_to_nome": reply_to_nome,
        "client_message_id": client_message_id,
        **dados_arquivo
    }
    try:
        armazenar_menssagem = Menssagens(**dados)
        db.session.add(armazenar_menssagem)
        db.session.commit()
    except IntegrityError as err:
        db.session.rollback()
        if client_message_id:
            existing_message = Menssagens.query.filter_by(
                client_message_id=client_message_id
            ).first()
            if (
                existing_message
                and str(existing_message.id_remitente) == str(id_remitente)
                and str(existing_message.nossa_sala) == str(nossa_sala)
            ):
                return {
                    "success": True,
                    "mensagem_id": existing_message.id,
                    "client_message_id": client_message_id
                }
        print(f"erro ao armazenar a menssagem: {err}")
        return {"success": False, "error": "Mensagem não foi armazenada no banco de dados"}
    except Exception as err:
        db.session.rollback()
        print(f"erro ao armazenar a menssagem: {err}")
        return {"success": False, "error": "Mensagem não foi armazenada no banco de dados"}

    dados["id"] = armazenar_menssagem.id
    print("menssagem armazenada com sucesso")

    try:
        texto_notificacao = str(menssagem or "Você recebeu uma nova mensagem.")
        if len(texto_notificacao) > 160:
            texto_notificacao = f"{texto_notificacao[:157]}..."
        enviar_notificacao_pushy(
            id_amigo,
            nome_remitente or "Nova mensagem",
            texto_notificacao,
            {
                "type": "new_message",
                "sender_id": id_remitente,
                "room": nossa_sala,
                "foto_usuario": foto_remitente,
                "foto_remitente": foto_remitente,
            },
            sala_ativa=nossa_sala
        )
        

        # --- LÓGICA DE NOTIFICAÇÃO (BOLINHA) ---
        
        # 2. Conta quantas mensagens não lidas o DESTINATÁRIO tem NESTA sala
        quantidade = Menssagens.query.filter_by(
            id_destinatario = id_amigo,
            nossa_sala = nossa_sala,
            lida = False
        ).count()

        # 3. Envia APENAS para o destinatário a nova quantidade
        # O id_amigo no pacote é o id_remitente (quem enviou), 
        # para que o destinatário saiba de QUEM é a notificação.
        emit("responsta_nova_quantidade_de_menssagem", {
            "quantidade": quantidade,
            "id_amigo": id_remitente,
            "nossa_sala":nossa_sala,
            "nova_menssagem":menssagem,
            "horario_formatado":horario_formatado,
            "ultima_menssagem_remitente_id": id_remitente,
            "ultima_menssagem_lida": False
        }, room = str(id_amigo))
    except Exception as err:
        print(f"mensagem persistida, mas falhou uma notificação secundária: {err}")

    # 4. Envia a mensagem para a sala de chat aberta
    emit("receber_menssagem", dados, room = str(nossa_sala))
    return {
        "success": True,
        "mensagem_id": armazenar_menssagem.id,
        "client_message_id": client_message_id
    }