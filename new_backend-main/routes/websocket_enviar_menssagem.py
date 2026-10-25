from flask_socketio import join_room, leave_room, emit
from routes.websocket import socketio
from datetime import datetime 
import json
from models.database import Menssagens , db , Amigo
from service.pushy_service import enviar_notificacao_pushy

@socketio.on("enviar_menssagem_na_sala")
def enviar_menssagem_na_sala(data):
    agora = datetime.now()
    horario_formatado = agora.strftime("%H:%M") 

    nossa_sala = data.get("nossa_sala")
    menssagem = data.get("menssagem")
    id_remitente = data.get("id_remitente")
    nome_remitente = data.get("nome_remitente")
    id_amigo = data.get("id_amigo")
    nome_amigo = data.get("nome_amigo")

    dados_arquivo = {}
    try:
        conteudo = json.loads(menssagem) if isinstance(menssagem, str) else {}
        if isinstance(conteudo, dict) and conteudo.get("isFile"):
            if not conteudo.get("fileUrl") or not conteudo.get("publicId"):
                print("arquivo recebido sem fileUrl/publicId; mensagem não será persistida")
                return {"success": False, "error": "Metadados do arquivo incompletos"}

            try:
                tamanho_arquivo = int(conteudo.get("fileSize") or 0)
            except (TypeError, ValueError):
                tamanho_arquivo = 0

            dados_arquivo = {
                "tipo": "arquivo",
                "file_url": conteudo.get("fileUrl"),
                "public_id": conteudo.get("publicId"),
                "file_name": conteudo.get("fileName"),
                "mime_type": conteudo.get("mimeType"),
                "file_size": tamanho_arquivo
            }
    except (TypeError, ValueError):
        pass

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
        **dados_arquivo
    }
    verificar_amizade = Amigo.query.all()


    try:
        armazenar_menssagem = Menssagens(**dados)
        db.session.add(armazenar_menssagem)
        db.session.commit()
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
                "room": nossa_sala
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
            "horario_formatado":horario_formatado
        }, room = str(id_amigo))
    except Exception as err:
        print(f"mensagem persistida, mas falhou uma notificação secundária: {err}")

    # 4. Envia a mensagem para a sala de chat aberta
    emit("receber_menssagem", dados, room = str(nossa_sala))
    return {"success": True, "mensagem_id": armazenar_menssagem.id}