from flask import Blueprint , current_app , request , jsonify , url_for
from models.database import Adicionar_dados_estado , db
import cloudinary.uploader
import os
from uuid import uuid4
from werkzeug.utils import secure_filename

EstadoMusicaUsuario = Blueprint("estadoMusicaUsuario" , __name__)

@EstadoMusicaUsuario.route("/api/adicionar_estado_musica" , methods = ["POST"])
def estado_musica_usuario():
    caminho_local = None
    try:
        id_usuario = request.form.get("id_usuario")
        musica_estado = request.files.get("musica_estado")
        conteiner_descricao_musicaID = request.form.get("conteiner_descricao_musicaID")
        tipo_musica = request.form.get("tipo_musica")
        nome_usuario = request.form.get("nome_usuario")
        foto_usuario = request.form.get("foto_usuario")
        if not musica_estado or not musica_estado.filename:
            return jsonify({"resposta": "nenhuma música selecionada"}), 400

        nome_seguro = secure_filename(musica_estado.filename) or "estado_musica"
        nome_arquivo = f"ancora_{uuid4().hex}_{nome_seguro}"

        try:
            resultado_upload = cloudinary.uploader.upload(
                musica_estado,
                folder="usuario/estados/musicas",
                resource_type="video"
            )
            url_musica = resultado_upload.get("secure_url")
            if not url_musica:
                raise RuntimeError("Cloudinary não retornou a URL segura da música")
        except Exception as erro_cloudinary:
            print(f"Falha no Cloudinary; salvando o estado localmente: {erro_cloudinary}")
            musica_estado.seek(0)
            pasta_local = os.path.join(current_app.static_folder, "mucicas", "estado")
            os.makedirs(pasta_local, exist_ok=True)
            caminho_local = os.path.join(pasta_local, nome_arquivo)
            musica_estado.save(caminho_local)
            url_musica = url_for(
                "static",
                filename=f"mucicas/estado/{nome_arquivo}",
                _external=True
            )

        dadosGeral = {
            "id_usuario":id_usuario,
            "dados_estado":url_musica,
            "descricao_dados":conteiner_descricao_musicaID,
            "tipo_estado":tipo_musica,
            "nome_usuario_estado":nome_usuario,
            "foto_usuario_estado":foto_usuario
        }
        adicionar_novo_estado = Adicionar_dados_estado(**dadosGeral)
        db.session.add(adicionar_novo_estado)
        db.session.commit()
        return jsonify({"resposta":"boas"})
    except Exception as erro:
        db.session.rollback()
        if caminho_local and os.path.exists(caminho_local):
            os.remove(caminho_local)
        print(f"parece que ouve um erro ao registrar o estado de musica deste usuario:{erro}")
        return jsonify({"resposta":"erro ao registrar estado de música"}), 500

    
