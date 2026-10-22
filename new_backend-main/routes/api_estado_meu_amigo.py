from flask import Blueprint , request , jsonify
from models.database import Adicionar_dados_estado , Amigo 
EstadoMeuAmigo = Blueprint("EstadoMeuAmigo", __name__)

@EstadoMeuAmigo.route("/estado_meu_amigo/<int:id_usuario>" , methods = ["GET"])
def estado_meu_amigo (id_usuario):
    try:
        meus_amigo = Amigo.query.filter(
            Amigo.id_amigo == int(id_usuario)
        ).all()

        lista_estado = []

        if meus_amigo:
            print("tem sim amigo para pegar o estado avelino...")
            for amigo in meus_amigo:
                dados_estado_meus_amigo = ""
                if amigo.id_amigo == int(id_usuario):
                    estado_meus_amigo = Adicionar_dados_estado.query.filter(
                        Adicionar_dados_estado.id_usuario == int(amigo.id_usuario)
                    ).all()
                    for x in estado_meus_amigo:
                        dados_estado = {
                            "id_usuario":x.id_usuario ,
                            "dados_estado":x.dados_estado,
                            "descricao_dados":x.descricao_dados,
                            "visualizacao_dados":x.visualizacao_dados,
                            "adoro_dados":x.adoro_dados,
                            "tipo_estado":x.tipo_estado,
                            "nome_usuario_estado":x.nome_usuario_estado,
                            "foto_usuario_estado":x.foto_usuario_estado 
                         }
                 
                        lista_estado.append(dados_estado)


                elif amigo.id_usuario == int(id_usuario):
                    estado_meus_amigo = Adicionar_dados_estado.query.filter(
                        Adicionar_dados_estado.id_usuario == int(amigo.id_amigo)
                    ).all()
                    for x in estado_meus_amigo:
                        dados_estado = {
                            "id_usuario":x.id_usuario ,
                            "dados_estado":x.dados_estado,
                            "descricao_dados":x.descricao_dados,
                            "visualizacao_dados":x.visualizacao_dados,
                            "adoro_dados":x.adoro_dados,
                            "tipo_estado":x.tipo_estado,
                            "nome_usuario_estado":x.nome_usuario_estado,
                            "foto_usuario_estado":x.foto_usuario_estado 
                        }
                        lista_estado.append(dados_estado)


        else:
            print("nenhum amigo para pegar o estado avelino")

        return lista_estado
    except Exception as erro:
        print(f"erro ao buscar os estado do seu amigo:{erro}")
        return []




    