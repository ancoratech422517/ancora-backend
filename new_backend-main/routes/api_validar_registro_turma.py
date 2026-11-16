import cloudinary.uploader
from flask import Blueprint, current_app, g, jsonify, request

from models.database import Turma_Aula, db
from service.media_metadata import validate_blurhash
from service.upload_validation import upload_size, validate_extension


api_validar_registro_turma = Blueprint("api_validar_registro_turma", __name__)


@api_validar_registro_turma.route("/validar-registro-turma", methods=["POST"])
def validar_registro_turma():
    try:
        try:
            user_id = int(g.principal["sub"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "Sessão inválida"}), 401

        nome_turma = request.form.get("nome_turma", "").strip()
        imagem_turma = request.files.get("img_turma")
        if not nome_turma or len(nome_turma) > 100 or not imagem_turma or not imagem_turma.filename:
            return jsonify({"error": "Nome e imagem da turma são obrigatórios."}), 400
        try:
            validate_extension(imagem_turma, {"jpg", "jpeg", "png", "webp", "gif"})
            upload_size(imagem_turma, 10 * 1024 * 1024)
            imagem_blurhash = validate_blurhash(request.form.get("imagem_blurhash"))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

        nome_seguro_turma = nome_turma.replace(" ", "_")
        sala_turma = f"Turma_{user_id}_admin_{nome_seguro_turma}"
        if Turma_Aula.query.filter_by(
            id_admin_Turma=user_id,
            nome_Turma=nome_turma,
            tipo_usuario_Turma="admin",
        ).first():
            return jsonify({"error": "Já existe uma turma com esse nome."}), 409

        try:
            uploaded = cloudinary.uploader.upload(
                imagem_turma,
                folder="usuario/turmas",
                resource_type="image",
            )
        except Exception as error:
            current_app.logger.warning(
                "Falha no upload da imagem da turma (%s)", type(error).__name__
            )
            return jsonify({"error": "Serviço de imagens temporariamente indisponível."}), 503

        image_url = uploaded.get("secure_url")
        if not isinstance(image_url, str) or not image_url.startswith("https://"):
            return jsonify({"error": "Não foi possível confirmar a imagem da turma."}), 502

        nova_turma = Turma_Aula(
            nome_Turma=nome_turma,
            id_admin_Turma=user_id,
            tipo_usuario_Turma="admin",
            id_aluno_Turma=str(user_id),
            sala_Turma=sala_turma,
            imagem_perfil_Turma=image_url,
            imagem_perfil_Turma_blurhash=imagem_blurhash,
        )
        db.session.add(nova_turma)
        db.session.commit()
        return jsonify({"message": "Turma criada com sucesso."}), 201
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao criar turma")
        return jsonify({"error": "Falha ao criar turma."}), 500
