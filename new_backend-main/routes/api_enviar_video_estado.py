from flask import Blueprint, current_app, g, request, jsonify
from models.database import Adicionar_dados_estado, Usuario, db
from service.estado_realtime_service import notificar_amigos_novo_estado
import cloudinary.uploader
from service.upload_validation import upload_size, validate_extension

EstadoVideo = Blueprint("estadoVideo",__name__)

@EstadoVideo.route("/api/enviar_video_estado" , methods = ["POST"])
def estado_video ():
    try:
        user_id = int(g.principal["sub"])
        usuario = db.session.get(Usuario, user_id)
        if not usuario:
            return jsonify({"resposta": "Utilizador não encontrado"}), 404
        descricao_video = request.form.get("descricao_video")
        video_estado = request.files.get("video_estado")
        tipo_estado = request.form.get("tipo_estado")

        if not video_estado or not video_estado.filename:
            return jsonify({"resposta":"tens que selecionar uma video"}), 400

        try:
            validate_extension(video_estado, {"mp4", "webm", "mov"})
            upload_size(video_estado, 100 * 1024 * 1024)
        except ValueError as error:
            return jsonify({"resposta": str(error)}), 400

        try:
            resultado_upload = cloudinary.uploader.upload(
                video_estado,
                folder="usuario/estados/videos",
                resource_type="video"
            )
            URL_VIDEO = resultado_upload.get("secure_url")
            if not URL_VIDEO:
                raise RuntimeError("Cloudinary não retornou a URL segura do vídeo")
        except Exception as erro_cloudinary:
            current_app.logger.warning(
                "Falha no upload de vídeo de estado (%s)", type(erro_cloudinary).__name__
            )
            return jsonify({"resposta": "Serviço de vídeo temporariamente indisponível"}), 503


        dados_geral = {
            "nome_usuario_estado": usuario.nome,
            "foto_usuario_estado": usuario.foto_usuario,
            "id_usuario": user_id,
            "dados_estado":URL_VIDEO,
            "descricao_dados":descricao_video,
            "tipo_estado":tipo_estado
        }

        novo_estado  = Adicionar_dados_estado(**dados_geral)
        db.session.add(novo_estado)
        db.session.commit()
        notificar_amigos_novo_estado(novo_estado)

        return jsonify({"resposta": "Boas , estado registrado com sucesso"})

    except Exception as erro:
        db.session.rollback()
        current_app.logger.exception("Falha ao guardar vídeo de estado")
        return jsonify({"resposta":"erro ao registrar estado de vídeo"}), 500
    
