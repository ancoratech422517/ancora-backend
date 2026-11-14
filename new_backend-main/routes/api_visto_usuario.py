from flask import Blueprint, current_app, g, request, jsonify
from models.database import Tabel_Reacao_Produto , db
from models.database import Registrar_produto
visto_usuario = Blueprint("visto_usuario" , __name__)

@visto_usuario.route("/visto_usuario" , methods = ["post"])
def VistoUsuario():
    try:
        dados_usuario = request.get_json(silent=True)
        if not isinstance(dados_usuario, dict):
            return jsonify({"status": "Dados inválidos"}), 400
        id_usuario = int(g.principal["sub"])
        id_produto = int(dados_usuario.get("id_produto"))

        get_data_table_reacao_product = Tabel_Reacao_Produto.query.filter(
            Tabel_Reacao_Produto.id_usuario == id_usuario,
            Tabel_Reacao_Produto.id_produto == id_produto
        ).first()
        
        if get_data_table_reacao_product:
            return jsonify({"status": "Visualização registada"})
        else:
            produto = db.session.get(Registrar_produto, id_produto)
            if not produto:
                return jsonify({"status": "Produto não encontrado"}), 404
            db.session.add(Tabel_Reacao_Produto(
                id_usuario=id_usuario,
                estado_visualizacao="1",
                estado_adoro="0",
                id_produto=str(id_produto),
            ))
            produto.visualizacao_produto = int(produto.visualizacao_produto) + 1
            db.session.commit()

        return jsonify({"status": "Visualização registada"})
    except (TypeError, ValueError):
        return jsonify({"status": "Identificadores inválidos"}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar visualização do produto")
        return jsonify({"status": "Não foi possível registar a visualização"}), 500
