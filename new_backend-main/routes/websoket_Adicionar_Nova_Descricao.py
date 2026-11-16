from routes.websocket import socketio
from models.database import Adicionar_dados_estado , db , Amigo
from service.estado_realtime_service import notificar_amigos_novo_estado
from routes.websoket_conectUser import get_user_id_from_cookie
from models.database import Usuario

@socketio.on("Adicionar_Nova_Descricao")
def AdicionarNovaDescricao(dados):
    try:
        if not isinstance(dados, dict):
            return {"success": False, "error": "Dados inválidos"}
        user_id = get_user_id_from_cookie()
        if not user_id:
            return {"success": False, "error": "Sessão expirada"}
        usuario = db.session.get(Usuario, int(user_id))
        descricao = dados.get("descricao")
        tipo_estado = dados.get("tipo-estado")
        if not usuario or not isinstance(descricao, str) or len(descricao.strip()) > 1000:
            return {"success": False, "error": "Descrição inválida"}

        dados_geral = {
            "id_usuario": int(user_id),
            "dados_estado": descricao , 
            "tipo_estado" : tipo_estado,
            "nome_usuario_estado": usuario.nome,
            "foto_usuario_estado": usuario.foto_usuario
        }
        if tipo_estado == "texto":
            novo_dados = Adicionar_dados_estado(**dados_geral)
            db.session.add(novo_dados)
            db.session.commit()
            notificar_amigos_novo_estado(novo_dados)
            print("dados armazenados no banco de dados com sucesso!")
            return {"success": True}
        return {"success": False, "error": "Tipo de estado inválido"}
    except Exception as erro:
        db.session.rollback()
        print(f"erro ao armazenar o novo estado:{erro}")    
        return {"success": False, "error": "Não foi possível guardar o estado"}
