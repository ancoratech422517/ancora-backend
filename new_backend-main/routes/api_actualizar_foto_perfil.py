import re
from urllib.parse import urlsplit

import cloudinary.uploader
from flask import Blueprint, current_app, g, jsonify, request

from models.database import Usuario, db
from service.media_metadata import validate_blurhash
from service.upload_validation import upload_size, validate_extension


Actualizar_foto_perfil = Blueprint("Actualizar_foto_perfil", __name__)


@Actualizar_foto_perfil.route("/actualizar_foto_perfil", methods=["POST"])
def actualizar_foto_perfil_usuario():
    try:
        try:
            user_id = int(g.principal["sub"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"status": "Sessão inválida"}), 401
        usuario = db.session.get(Usuario, user_id)
        if not usuario:
            return jsonify({"status": "Utilizador não encontrado"}), 404

        foto = request.files.get("foto")
        if not foto or not foto.filename:
            return jsonify({"status": "Seleciona uma foto"}), 400
        try:
            validate_extension(foto, {"jpg", "jpeg", "png", "webp", "gif"})
            upload_size(foto, 5 * 1024 * 1024)
            foto_blurhash = validate_blurhash(request.form.get("foto_blurhash"))
        except ValueError as error:
            return jsonify({"status": "Ficheiro inválido", "erro": str(error)}), 400

        try:
            uploaded = cloudinary.uploader.upload(
                foto,
                folder="usuarios/fotos_perfil",
                resource_type="image",
            )
        except Exception as error:
            current_app.logger.warning(
                "Falha ao atualizar imagem de perfil (%s)", type(error).__name__
            )
            return jsonify({"status": "Serviço de imagens indisponível"}), 503

        new_url = uploaded.get("secure_url")
        if not isinstance(new_url, str) or not new_url.startswith("https://"):
            return jsonify({"status": "Não foi possível confirmar a imagem"}), 502

        old_url = usuario.foto_usuario
        usuario.foto_usuario = new_url
        usuario.foto_usuario_blurhash = foto_blurhash
        db.session.commit()

        if isinstance(old_url, str):
            parts = urlsplit(old_url)
            match = re.search(r"/image/upload/(?:v\d+/)?(.+?)(?:\.\w+)?$", parts.path)
            if parts.scheme == "https" and parts.netloc == "res.cloudinary.com" and match:
                try:
                    cloudinary.uploader.destroy(match.group(1), resource_type="image", invalidate=True)
                except Exception:
                    current_app.logger.info("A foto antiga ficou pendente de limpeza no Cloudinary")

        return jsonify({"status": "foto atualizada com sucesso", "imagem": new_url})
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Erro ao atualizar imagem de perfil")
        return jsonify({"status": "Erro interno"}), 500
