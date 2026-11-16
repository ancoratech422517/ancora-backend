from flask import Blueprint, current_app, request, jsonify
import cloudinary.uploader
from service.api_register import register_user
from service.media_metadata import validate_blurhash
from service.upload_validation import upload_size, validate_extension

registrar = Blueprint("registrar", __name__)

@registrar.route("/api/Registrar", methods=["POST"])
def registro():
    try:
        # Pegar dados do formulário
        nome = request.form.get("nome")
        email = request.form.get("email")
        senha = request.form.get("senha")
        confirmar_senha = request.form.get("confirmar_senha")
        telefone = request.form.get("telefone")
        data_nascimento = request.form.get("data_nascimento")
        continente = request.form.get("continente")
        pais = request.form.get("pais")
        provincia = request.form.get("provincia")
        capital = request.form.get("capital")
        bairro = request.form.get("bairro")

        foto = request.files.get("foto")
        try:
            foto_blurhash = validate_blurhash(request.form.get("foto_blurhash"))
        except ValueError as erro:
            return jsonify({"status": "erro", "message": str(erro)}), 400

        if not isinstance(nome, str) or not nome.strip() or len(nome.strip()) > 100:
            return jsonify({"status": "erro", "message": "O nome é obrigatório e deve ter até 100 caracteres."}), 400
        if not isinstance(telefone, str) or not telefone.strip() or len(telefone) > 20:
            return jsonify({"status": "erro", "message": "O telefone é obrigatório e inválido."}), 400
        if not isinstance(senha, str) or len(senha) < 12 or len(senha) > 128:
            return jsonify({"status": "erro", "message": "A senha deve ter entre 12 e 128 caracteres."}), 400
        if senha != confirmar_senha:
            return jsonify({"status": "erro", "message": "As senhas não coincidem."}), 400
        if not isinstance(email, str) or len(email) > 254:
            return jsonify({"status": "erro", "message": "O email é inválido."}), 400

        # URL da foto (padrão caso não envie foto)
        foto_url = None

        if foto and foto.filename != "":
            try:
                validate_extension(foto, {"jpg", "jpeg", "png", "webp", "gif"})
                upload_size(foto, 5 * 1024 * 1024)
                upload_result = cloudinary.uploader.upload(
                    foto,
                    folder="usuarios/fotos_perfil",
                    resource_type="image"
                )
                foto_url = upload_result.get("secure_url")
                if not foto_url or not foto_url.startswith("https://"):
                    raise RuntimeError("O armazenamento não confirmou a imagem.")
            except ValueError as erro:
                return jsonify({"status": "erro", "message": str(erro)}), 400
            except Exception as erro:
                current_app.logger.warning(
                    "Falha ao guardar a imagem de registo (%s)",
                    type(erro).__name__,
                )
                return jsonify({
                    "status": "erro",
                    "message": "O serviço de imagens está temporariamente indisponível.",
                }), 503
                

        # Chamar o serviço de registro
        serviço = register_user()
        resultado, status_code = serviço.registrar_usuario(
            nome=nome,
            telefone=telefone,
            senha=senha,
            confirmar_senha=confirmar_senha,
            email=email,
            data_nascimento=data_nascimento,
            foto=foto_url,                    # ← Agora passa a URL do Cloudinary
            foto_blurhash=foto_blurhash,
            continente=continente,
            pais=pais,
            provincia=provincia,
            capital=capital,
            bairro=bairro
        )

        return jsonify(resultado), status_code

    except Exception:
        current_app.logger.exception("Falha inesperada no registo de utilizador")
        return jsonify({"status": "erro", "message": "Não foi possível concluir o registo."}), 500
