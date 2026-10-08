from flask import Blueprint , current_app , request , jsonify , url_for
from models.database import Adicionar_dados_estado , db
import cloudinary.uploader
import os
from uuid import uuid4
from werkzeug.utils import secure_filename

EstadoVideo = Blueprint("estadoVideo",__name__)

@EstadoVideo.route("/api/enviar_video_estado" , methods = ["POST"])
def estado_video ():
    caminho_local = None
    try:
        nome_usuario = request.form.get("nome_usuario")
        foto_usuario = request.form.get("foto_usuario")
        id_usuario = request.form.get("id_usuario")
        descricao_video = request.form.get("descricao_video")
        video_estado = request.files.get("video_estado")
        tipo_estado = request.form.get("tipo_estado")

        if not video_estado or not video_estado.filename:
            return jsonify({"resposta":"tens que selecionar uma video"}), 400

        nome_seguro = secure_filename(video_estado.filename) or "estado_video"
        nome_arquivo = f"ancora_{uuid4().hex}_{nome_seguro}"

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
            print(f"Falha no Cloudinary; salvando o estado localmente: {erro_cloudinary}")
            video_estado.seek(0)
            pasta_local = os.path.join(current_app.static_folder, "video", "estado")
            os.makedirs(pasta_local, exist_ok=True)
            caminho_local = os.path.join(pasta_local, nome_arquivo)
            video_estado.save(caminho_local)
            URL_VIDEO = url_for(
                "static",
                filename=f"video/estado/{nome_arquivo}",
                _external=True
            )


        dados_geral = {
            "nome_usuario_estado": nome_usuario,
            "foto_usuario_estado" : foto_usuario,
            "id_usuario": id_usuario,
            "dados_estado":URL_VIDEO,
            "descricao_dados":descricao_video,
            "tipo_estado":tipo_estado
        }

        novo_estado  = Adicionar_dados_estado(**dados_geral)
        db.session.add(novo_estado)
        db.session.commit()

        return jsonify({"resposta": "Boas , estado registrado com sucesso"})

    except Exception as erro:
        db.session.rollback()
        if caminho_local and os.path.exists(caminho_local):
            os.remove(caminho_local)
        print(f"este é o tipo do erro:{erro}")
        return jsonify({"resposta":"erro ao registrar estado de vídeo"}), 500
    

