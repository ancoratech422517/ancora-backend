from flask import Blueprint, g, jsonify
from models.database import Tabel_Reacao_Produto , Registrar_produto
getDadosVisualizacaoUsuario = Blueprint("getDadosVisualizacaoUsuario",__name__)

@getDadosVisualizacaoUsuario.route("/get_dados_visualizacao_usuario/<int:id_usuario>" , methods = ["get"])
def getDadosVisualizacaoUser(id_usuario):
    if str(id_usuario) != g.principal["sub"]:
        return jsonify({"error": "Sem permissão para consultar estes dados"}), 403
    try:
        usuario_ativo = Tabel_Reacao_Produto.query.filter(
            Tabel_Reacao_Produto.id_usuario == id_usuario
        ).first()
        if usuario_ativo:
            return jsonify({"status":"True"})
        else:
            return jsonify({"status":"False"})
    except Exception as erro:
        return jsonify({"erro":erro})
    

