from flask import Blueprint , request , jsonify
from models.database import Adicionar_dados_estado , Amigo 
EstadoMeuAmigo = Blueprint("EstadoMeuAmigo", __name__)

@EstadoMeuAmigo.route("/estado_meu_amigo/<int:id_usuario>" , methods = ["GET"])
def estado_meu_amigo (id_usuario):
    try:
        id_usuario = int(id_usuario)
        amizades = Amigo.query.filter(
            (Amigo.id_amigo == id_usuario) | (Amigo.id_usuario == id_usuario)
        ).all()
        ids_amigos = {
            amizade.id_usuario if amizade.id_amigo == id_usuario else amizade.id_amigo
            for amizade in amizades
        }
        lista_estado = []
        for id_amigo in ids_amigos:
            estados_amigo = Adicionar_dados_estado.query.filter(
                Adicionar_dados_estado.id_usuario == id_amigo
            ).all()
            for estado in estados_amigo:
                lista_estado.append({
                    "id": estado.id,
                    "id_usuario": estado.id_usuario,
                    "dados_estado": estado.dados_estado,
                    "media_blurhash": estado.media_blurhash,
                    "descricao_dados": estado.descricao_dados,
                    "visualizacao_dados": estado.visualizacao_dados,
                    "adoro_dados": estado.adoro_dados,
                    "tipo_estado": estado.tipo_estado,
                    "nome_usuario_estado": estado.nome_usuario_estado,
                    "foto_usuario_estado": estado.foto_usuario_estado
                })

        return lista_estado
    except Exception as erro:
        print(f"erro ao buscar os estado do seu amigo:{erro}")
        return []




    