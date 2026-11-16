from decimal import Decimal, InvalidOperation

import cloudinary.uploader
from flask import Blueprint, current_app, g, jsonify, request

from models.database import Registrar_produto, Usuario, db
from routes.websocket import socketio
from service.media_metadata import validate_blurhash
from service.upload_validation import upload_size, validate_extension


registrar_produto = Blueprint("registrar_produto", __name__)
MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024


@registrar_produto.route("/registrar_produto", methods=["POST"])
def registrarProduto():
    try:
        try:
            user_id = int(g.principal["sub"])
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "Sessão inválida"}), 401

        vendedor = db.session.get(Usuario, user_id)
        if not vendedor:
            return jsonify({"error": "Utilizador não encontrado"}), 404

        imagem = request.files.get("imagem_produto")
        if not imagem or not imagem.filename:
            return jsonify({"error": "Seleciona uma imagem para o produto."}), 400

        try:
            validate_extension(imagem, {"jpg", "jpeg", "png", "webp", "gif"})
            upload_size(imagem, MAX_PRODUCT_IMAGE_BYTES)
            imagem_blurhash = validate_blurhash(request.form.get("imagem_blurhash"))
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

        nome_produto = request.form.get("nome_produto", "").strip()
        descricao_produto = request.form.get("descricao_produto", "").strip()
        tipo_produto = request.form.get("tipo_produto", "").strip()
        preco_input = request.form.get("preco_produto", "").strip()
        if not nome_produto or len(nome_produto) > 100:
            return jsonify({"error": "O nome deve ter entre 1 e 100 caracteres."}), 400
        if not descricao_produto or len(descricao_produto) > 10_000:
            return jsonify({"error": "A descrição do produto é inválida."}), 400
        if not tipo_produto or len(tipo_produto) > 80:
            return jsonify({"error": "O tipo do produto é inválido."}), 400
        try:
            preco = Decimal(preco_input)
        except (InvalidOperation, TypeError, ValueError):
            return jsonify({"error": "O preço do produto é inválido."}), 400
        if not preco.is_finite() or preco <= 0 or preco > Decimal("1000000000000"):
            return jsonify({"error": "O preço do produto é inválido."}), 400

        try:
            upload_result = cloudinary.uploader.upload(
                imagem,
                folder="usuario/produto",
                resource_type="image",
            )
        except Exception as error:
            current_app.logger.warning(
                "Falha no upload da imagem do produto (%s)", type(error).__name__
            )
            return jsonify({
                "error": "O serviço de imagens está temporariamente indisponível."
            }), 503

        produto_url = upload_result.get("secure_url")
        if not isinstance(produto_url, str) or not produto_url.startswith("https://"):
            current_app.logger.error("Cloudinary não confirmou o URL HTTPS do produto")
            return jsonify({"error": "Não foi possível confirmar a imagem do produto."}), 502

        novo_produto = Registrar_produto(
            nome_produto=nome_produto,
            descricao_produto=descricao_produto,
            tipo_produto=tipo_produto,
            preco_produto=str(preco.normalize()),
            url_imagem_produto=produto_url,
            url_imagem_produto_blurhash=imagem_blurhash,
            id_usuario=user_id,
            nome_vendedor=vendedor.nome,
        )
        db.session.add(novo_produto)
        db.session.commit()

        produto_data = {
            "id": novo_produto.id,
            "nome": novo_produto.nome_produto,
            "descricao": novo_produto.descricao_produto,
            "tipo": novo_produto.tipo_produto,
            "preco": novo_produto.preco_produto,
            "url_imagem_produto": novo_produto.url_imagem_produto,
            "url_imagem_produto_blurhash": novo_produto.url_imagem_produto_blurhash,
            "id_usuario": novo_produto.id_usuario,
            "data_registro": str(getattr(novo_produto, "data_registro", None)),
        }
        socketio.emit("produto_registrado", produto_data, namespace="/")
        return jsonify({
            "status": "produto registrado com sucesso!",
            "url": produto_url,
            "produto": produto_data,
        }), 200
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar produto")
        return jsonify({"error": "Não foi possível registar o produto."}), 500
