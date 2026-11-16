import uuid
from datetime import datetime, timezone

import cloudinary.uploader
from flask import Blueprint, current_app, g, jsonify, request

from models.database import Amigo, Menssagens, Usuario, db
from service.pushy_service import enviar_notificacao_pushy
from service.friend_access import users_are_unblocked_friends
from service.upload_validation import upload_size, validate_extension


messages_http_bp = Blueprint("messages_http", __name__, url_prefix="/api")
MAX_CHAT_ATTACHMENT_BYTES = 25 * 1024 * 1024
ALLOWED_CHAT_EXTENSIONS = {
    "jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mp3", "wav",
    "m4a", "ogg", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "csv",
}


@messages_http_bp.route("/send-message-with-file", methods=["POST"])
def send_message_with_file():
    try:
        try:
            sender_id = int(g.principal["sub"])
            recipient_id = int(request.form.get("id_destinatario", ""))
        except (KeyError, TypeError, ValueError):
            return jsonify({"success": False, "error": "Conversa inválida"}), 400

        room = request.form.get("nossa_sala", "")
        if not isinstance(room, str) or not room or len(room) > 100:
            return jsonify({"success": False, "error": "Conversa inválida"}), 400
        friendship = Amigo.query.filter_by(
            id_usuario=sender_id,
            id_amigo=recipient_id,
            nossa_sala=room,
        ).first()
        if not friendship or not users_are_unblocked_friends(sender_id, recipient_id):
            return jsonify({"success": False, "error": "Sem acesso a esta conversa"}), 403

        sender = db.session.get(Usuario, sender_id)
        recipient = db.session.get(Usuario, recipient_id)
        if not sender or not recipient:
            return jsonify({"success": False, "error": "Utilizador não encontrado"}), 404

        message = request.form.get("menssagem", "")
        if not isinstance(message, str) or len(message) > 10_000:
            return jsonify({"success": False, "error": "Mensagem demasiado longa"}), 400
        file = request.files.get("file")

        file_url = public_id = file_name = mime_type = None
        file_size = 0
        if file and file.filename:
            try:
                extension = validate_extension(file, ALLOWED_CHAT_EXTENSIONS)
                file_size = upload_size(file, MAX_CHAT_ATTACHMENT_BYTES)
            except ValueError as error:
                return jsonify({"success": False, "error": str(error)}), 400
            try:
                uploaded = cloudinary.uploader.upload(
                    file,
                    public_id=f"{uuid.uuid4().hex}.{extension}",
                    folder="chat_files",
                    resource_type="auto",
                    overwrite=False,
                )
            except Exception as error:
                current_app.logger.warning(
                    "Falha no upload de anexo do chat (%s)", type(error).__name__
                )
                return jsonify({"success": False, "error": "Upload temporariamente indisponível"}), 503

            file_url = uploaded.get("secure_url")
            public_id = uploaded.get("public_id")
            if not isinstance(file_url, str) or not file_url.startswith("https://") or not public_id:
                return jsonify({"success": False, "error": "O armazenamento não confirmou o ficheiro"}), 502
            file_name = file.filename.replace("\\", "/").rsplit("/", 1)[-1][:255]
            mime_type = (file.content_type or "application/octet-stream")[:255]
            file_size = int(uploaded.get("bytes") or file_size)

        if not message.strip() and not file_url:
            return jsonify({"success": False, "error": "A mensagem não pode ficar vazia"}), 400

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        stored = Menssagens(
            nossa_sala=room,
            menssagem=message,
            id_remitente=sender_id,
            nome_remitente=sender.nome,
            id_destinatario=recipient_id,
            nome_destinatario=recipient.nome,
            data_envio=now.strftime("%H:%M"),
            lida=False,
            tipo="arquivo" if file_url else "texto",
            file_url=file_url,
            public_id=public_id,
            file_name=file_name,
            mime_type=mime_type,
            file_size=file_size,
        )
        db.session.add(stored)
        db.session.commit()

        notification_text = message or f"{sender.nome} enviou um ficheiro."
        notification_text = notification_text[:157] + "..." if len(notification_text) > 160 else notification_text
        enviar_notificacao_pushy(
            recipient_id,
            sender.nome,
            notification_text,
            {
                "type": "new_message",
                "sender_id": sender_id,
                "room": room,
                "message_type": stored.tipo,
                "file_name": file_name,
                "mime_type": mime_type,
            },
            sala_ativa=room,
        )
        return jsonify({
            "success": True,
            "mensagem_id": stored.id,
            "file_url": file_url,
            "tipo": stored.tipo,
        }), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao enviar mensagem com ficheiro")
        return jsonify({"success": False, "error": "Erro interno"}), 500
