from flask import Blueprint  , request , jsonify
from models.database import Tabel_Reacao_Produto, Registrar_produto , db
sistema_adoro_Ancora = Blueprint("sistema_adoro_ancora" , __name__)

@sistema_adoro_Ancora.route("/sistema_adoro_ancora", methods=["POST"])
def SistemaAdoroAncora():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")
        id_produto = dados.get("id_produto")

        if not id_usuario or not id_produto:
            return jsonify({"status": "erro", "message": "IDs obrigatórios"}), 400

        id_usuario = int(id_usuario)
        id_produto = int(id_produto)

        # Buscar reação existente
        reacao = Tabel_Reacao_Produto.query.filter_by(
            id_usuario=id_usuario,
            id_produto=str(id_produto)
        ).first()

        # Buscar produto
        produto = Registrar_produto.query.get(id_produto)
        if not produto:
            return jsonify({"status": "erro", "message": "Produto não encontrado"}), 404

        if reacao:
            # Alternar adoro
            if str(reacao.estado_adoro) == "1":
                reacao.estado_adoro = "0"
                produto.quantidade_adoro_produto = str(int(produto.quantidade_adoro_produto or 0) - 1)
            else:
                reacao.estado_adoro = "1"
                produto.quantidade_adoro_produto = str(int(produto.quantidade_adoro_produto or 0) + 1)
        else:
            # Nova reação
            nova = Tabel_Reacao_Produto(
                id_usuario=id_usuario,
                id_produto=str(id_produto),
                estado_visualizacao="1",
                estado_adoro="1"
            )
            db.session.add(nova)
            
            produto.quantidade_adoro_produto = str(int(produto.quantidade_adoro_produto or 0) + 1)
            if produto.visualizacao_produto:
                produto.visualizacao_produto = str(int(produto.visualizacao_produto or 0) + 1)

        db.session.commit()

        return jsonify({
            "status": "sucesso",
            "message": "Adoro atualizado com sucesso"
        })

    except Exception as e:
        db.session.rollback()
        print(f"Erro no sistema adoro: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 500