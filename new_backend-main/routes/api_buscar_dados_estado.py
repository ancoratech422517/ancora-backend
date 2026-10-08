from models.database import Adicionar_dados_estado
from flask import Blueprint , request , jsonify


DadosEstado = Blueprint("DadosEstados" , __name__)

@DadosEstado.route("/api/buscar_dados_estado/<int:id_usuario>" , methods = ["GET"])
def dados_estado(id_usuario):
    try:
  

        dados_estado_usuario = Adicionar_dados_estado.query.filter(
            Adicionar_dados_estado.id_usuario == int(id_usuario)
        ).all()

        if dados_estado_usuario:
            todos_dados = []
            for x in dados_estado_usuario:
                todos_dados.append({
                    "id_usuario":x.id_usuario,
                    "dados_estado":x.dados_estado,
                    "descricao_dados":x.descricao_dados,
                    "visualizacao_dados":x.visualizacao_dados,
                    "adoro_dados":x.adoro_dados,
                    "tipo_estado":x.tipo_estado,
                    "nome_usuario":x.nome_usuario_estado,
                    "foto_usuario":x.foto_usuario_estado

                })
            return jsonify(todos_dados)
        else:
            return jsonify([])
    except Exception as erro:
        print(f"ouve um erro ao buscar os dados do estado deste usuario:{erro}")
        return jsonify(erro)

                




