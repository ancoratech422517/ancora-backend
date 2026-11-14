from models.database import Usuario

class UserService:
    @staticmethod
    def listar_todos_para_chat(usuario_logado_id):
        usuarios = Usuario.query.filter(Usuario.id != usuario_logado_id).all()

        lista_formatada = []
        for user in usuarios:
            lista_formatada.append({
                "id": user.id,
                "nome": user.nome,
                "foto_usuario": user.foto_usuario,
            })
        return lista_formatada