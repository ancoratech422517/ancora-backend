from flask import Blueprint, current_app, g, request, jsonify
from models.database import Adicionar_dados_estado, Usuario, db
from service.estado_realtime_service import notificar_amigos_novo_estado
from service.media_metadata import validate_blurhash
import cloudinary.uploader
from service.upload_validation import upload_size, validate_extension

EstadoImagem = Blueprint("EstadoImagem" , __name__)

@EstadoImagem.route("/api/enviar_imagem_estado" , methods = ["POST"])
def estado_imagem ():
    try:
        user_id = int(g.principal["sub"])
        usuario = db.session.get(Usuario, user_id)
        if not usuario:
            return jsonify({"resposta": "Utilizador não encontrado"}), 404
        descricao_imagem = request.form.get("descricao_imagem")
        dados_estado = request.files.get("imagem_estado")
        tipo_estado = request.form.get("tipo_estado")
        try:
            media_blurhash = validate_blurhash(request.form.get("blurhash"))
        except ValueError as error:
            return jsonify({"resposta": str(error)}), 400
        if not dados_estado or not dados_estado.filename:
            return jsonify({"resposta":"nenhuma imagem celecionada"}), 400

        try:
            validate_extension(dados_estado, {"jpg", "jpeg", "png", "webp", "gif"})
            upload_size(dados_estado, 10 * 1024 * 1024)
        except ValueError as error:
            return jsonify({"resposta": str(error)}), 400

        try:
            resultado_upload = cloudinary.uploader.upload(
                dados_estado,
                folder="usuario/estados/imagens",
                resource_type="image"
            )
            URL_IMAGEM = resultado_upload.get("secure_url")
            if not URL_IMAGEM:
                raise RuntimeError("Cloudinary não retornou a URL segura da imagem")
        except Exception as erro_cloudinary:
            current_app.logger.warning(
                "Falha no upload de imagem de estado (%s)", type(erro_cloudinary).__name__
            )
            return jsonify({"resposta": "Serviço de imagens temporariamente indisponível"}), 503

        dados_geral = {
            "nome_usuario_estado":usuario.nome,
            "foto_usuario_estado":usuario.foto_usuario,
            "tipo_estado":tipo_estado,
            "descricao_dados":descricao_imagem,
            "id_usuario":user_id,
            "dados_estado":URL_IMAGEM,
            "media_blurhash":media_blurhash
        }
        novo_estado = Adicionar_dados_estado(**dados_geral)
        db.session.add(novo_estado)
        db.session.commit()
        notificar_amigos_novo_estado(novo_estado)
        return jsonify({"resposta":"Boas , novo estado registrado com sucesso!"})
    except Exception as erro:
        db.session.rollback()
        current_app.logger.exception("Falha ao guardar imagem de estado")
        return jsonify({"resposta":"parece que ouve um erro no backend"}), 500





