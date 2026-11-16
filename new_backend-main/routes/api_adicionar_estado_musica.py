from flask import Blueprint, current_app, g, request, jsonify
from models.database import Adicionar_dados_estado, Usuario, db
from service.estado_realtime_service import notificar_amigos_novo_estado
import cloudinary.uploader
from service.upload_validation import upload_size, validate_extension

EstadoMusicaUsuario = Blueprint("estadoMusicaUsuario" , __name__)

@EstadoMusicaUsuario.route("/api/adicionar_estado_musica" , methods = ["POST"])
def estado_musica_usuario():
    try:
        user_id = int(g.principal["sub"])
        usuario = db.session.get(Usuario, user_id)
        if not usuario:
            return jsonify({"resposta": "Utilizador não encontrado"}), 404
        musica_estado = request.files.get("musica_estado")
        conteiner_descricao_musicaID = request.form.get("conteiner_descricao_musicaID")
        tipo_musica = request.form.get("tipo_musica")
        if not musica_estado or not musica_estado.filename:
            return jsonify({"resposta": "nenhuma música selecionada"}), 400

        try:
            validate_extension(musica_estado, {"mp3", "m4a", "ogg", "wav", "aac", "flac"})
            upload_size(musica_estado, 25 * 1024 * 1024)
        except ValueError as error:
            return jsonify({"resposta": str(error)}), 400

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
            current_app.logger.warning(
                "Falha no upload de áudio de estado (%s)", type(erro_cloudinary).__name__
            )
            return jsonify({"resposta": "Serviço de áudio temporariamente indisponível"}), 503

        dadosGeral = {
            "id_usuario":user_id,
            "dados_estado":url_musica,
            "descricao_dados":conteiner_descricao_musicaID,
            "tipo_estado":tipo_musica,
            "nome_usuario_estado":usuario.nome,
            "foto_usuario_estado":usuario.foto_usuario
        }
        adicionar_novo_estado = Adicionar_dados_estado(**dadosGeral)
        db.session.add(adicionar_novo_estado)
        db.session.commit()
        notificar_amigos_novo_estado(adicionar_novo_estado)
        return jsonify({"resposta":"boas"})
    except Exception as erro:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar áudio de estado")
        return jsonify({"resposta":"erro ao registrar estado de música"}), 500

    
