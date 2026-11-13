from flask import Blueprint , current_app , request , jsonify , url_for
from models.database import Adicionar_dados_estado , db
from service.estado_realtime_service import notificar_amigos_novo_estado
from service.media_metadata import validate_blurhash
import cloudinary.uploader
import os
from uuid import uuid4
from werkzeug.utils import secure_filename

EstadoImagem = Blueprint("EstadoImagem" , __name__)

@EstadoImagem.route("/api/enviar_imagem_estado" , methods = ["POST"])
def estado_imagem ():
    caminho_local = None
    try:
        nome_usuario = request.form.get("nome_usuario")
        descricao_imagem = request.form.get("descricao_imagem")
        dados_estado = request.files.get("imagem_estado")
        tipo_estado = request.form.get("tipo_estado")
        foto_usuario = request.form.get("foto_usuario")
        id_usuario = request.form.get("id_usuario")
        try:
            media_blurhash = validate_blurhash(request.form.get("blurhash"))
        except ValueError as error:
            return jsonify({"resposta": str(error)}), 400
        if not dados_estado or not dados_estado.filename:
            return jsonify({"resposta":"nenhuma imagem celecionada"}), 400

        nome_seguro = secure_filename(dados_estado.filename) or "estado_imagem"
        nome_arquivo = f"ancora_{uuid4().hex}_{nome_seguro}"

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
            print(f"Falha no Cloudinary; salvando o estado localmente: {erro_cloudinary}")
            dados_estado.seek(0)
            pasta_local = os.path.join(current_app.static_folder, "imagem", "estado")
            os.makedirs(pasta_local, exist_ok=True)
            caminho_local = os.path.join(pasta_local, nome_arquivo)
            dados_estado.save(caminho_local)
            URL_IMAGEM = url_for(
                "static",
                filename=f"imagem/estado/{nome_arquivo}",
                _external=True
            )

        dados_geral = {
            "nome_usuario_estado":nome_usuario,
            "foto_usuario_estado":foto_usuario,
            "tipo_estado":tipo_estado,
            "descricao_dados":descricao_imagem,
            "id_usuario":id_usuario,
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
        if caminho_local and os.path.exists(caminho_local):
            os.remove(caminho_local)
        print(f"parece que ouve um erro avelino:{erro}")
        return jsonify({"resposta":"parece que ouve um erro no backend"}), 500




    