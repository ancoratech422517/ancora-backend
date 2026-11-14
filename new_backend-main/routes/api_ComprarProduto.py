from flask import Blueprint, current_app, g, request, jsonify
from models.database import (
    db,
    Pedidos_Produto,
    Cliente_vendedor,
    Registrar_produto,
    Usuario,
)
from datetime import datetime
ComprarProduto = Blueprint("Comprar_produto", __name__)


@ComprarProduto.route("/ComprarProduto", methods=["POST"])
def Comprar_produto():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"status": "Dados de compra inválidos"}), 400
        try:
            id_cliente = int(g.principal["sub"])
            id_produto = int(data.get("id_produto"))
        except (KeyError, TypeError, ValueError):
            return jsonify({"status": "Identificadores inválidos"}), 400

        produto = db.session.get(Registrar_produto, id_produto)
        cliente = db.session.get(Usuario, id_cliente)
        if not produto or not cliente:
            return jsonify({"status": "Produto ou utilizador não encontrado"}), 404
        if produto.id_usuario == id_cliente:
            return jsonify({"status": "Não pode comprar o seu próprio produto"}), 400

        telefone_conta_cliente = data.get("telefone_conta_cliente")
        if not isinstance(telefone_conta_cliente, str) or not telefone_conta_cliente.strip():
            return jsonify({"status": "A conta do cliente é obrigatória"}), 400

        nome_cliente = cliente.nome
        nome_produto = produto.nome_produto
        preco_produto = produto.preco_produto
        id_vendedor = produto.id_usuario
        urlImage = produto.url_imagem_produto

        dados_da_compra_do_produto_cliente = {
            "nome_cliente":nome_cliente,
            "id_cliente":id_cliente,
            "nome_produto":nome_produto,
            "preco_produto":preco_produto,
            "id_vendedor":id_vendedor,
            "telefone_conta_cliente":telefone_conta_cliente,
            "data_envio":datetime.now(),
            "imagem_produto":urlImage,
            "pedido":"meus_pedidos"
        }
        dados_da_compra_do_produto_vendedor = {
            "nome_cliente":nome_cliente,
            "id_cliente":id_cliente,
            "nome_produto":nome_produto,
            "preco_produto":preco_produto,
            "id_vendedor":id_vendedor,
            "telefone_conta_cliente":telefone_conta_cliente,
            "data_envio":datetime.now(),
            "imagem_produto":urlImage,
            "pedido":"cliente"
        }


        #registra o usuario que comprou o produto na tabela do vendedor como um dos clientes do vendedor
        dados_cliente = {
            "id_vendedor":id_vendedor,
            "id_cliente":id_cliente,
            "nome_cliente":nome_cliente,
            "nome_produto":nome_produto
        }
        #dos a serem registrado
        novo_pedido_cliente = Pedidos_Produto(**dados_da_compra_do_produto_cliente)
        novo_pedido_vendedor = Pedidos_Produto(**dados_da_compra_do_produto_vendedor)
        novo_cliente = Cliente_vendedor(**dados_cliente)
        
        db.session.add(novo_pedido_cliente)
        db.session.add(novo_pedido_vendedor)
        db.session.add(novo_cliente)
        db.session.commit()
        dados_da_compra_do_produto_vendedor["id_pedido"] = novo_pedido_cliente.id
        #fim do registro dos dados no banco de dados

        return jsonify({
            "status": "Pedido registado; pagamento pendente.",
            "dados": dados_da_compra_do_produto_vendedor,
        })

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar pedido de produto")
        return jsonify({"status": "Não foi possível registar o pedido"}), 500
    
