from routes.websocket import socketio
from models.database import Adicionar_dados_estado , db , Amigo

@socketio.on("Adicionar_Nova_Descricao")
def AdicionarNovaDescricao(dados):
    try:
        id_usuario = dados.get("id_usuario")
        nome_usuario = dados.get("nome_usuario")
        foto_usuario = dados.get("foto_usuario")
        descricao = dados.get("descricao")
        tipo_estado = dados.get("tipo-estado")

        dados_geral = {
            "id_usuario": int(id_usuario),
            "dados_estado": descricao , 
            "tipo_estado" : tipo_estado,
            "nome_usuario_estado":nome_usuario,
            "foto_usuario_estado":foto_usuario
        }
        if tipo_estado == "texto":
            novo_dados = Adicionar_dados_estado(**dados_geral)
            db.session.add(novo_dados)
            db.session.commit()
            print("dados armazenados no banco de dados com sucesso!")
    except Exception as erro:
        print(f"erro ao armazenar o novo estado:{erro}")    
