from werkzeug.security import check_password_hash
from models.database import Usuario, db
from service.phone_number import normalizar_telefone

class AuthService:
    @staticmethod
    def validar_login(telefone, senha_pura):
        telefone = normalizar_telefone(telefone)
        if not telefone:
            return None

        usuario = Usuario.query.filter_by(telefone=telefone).first()
        
        # Remove esses prints em produção. Vazam dados.
        # print(f"este é o primeiro dados da vverificação:{usuario}")
        # for x in usuario.query.all():
        #     print(x.nome)
        
        if not usuario or not check_password_hash(usuario.senha_hash, senha_pura):
            return None  # Falha: retorna None

        usuario_dados = {
            "id":usuario.id,
            "nome":usuario.nome,
            "telefone":usuario.telefone,
            "foto_usuario":usuario.foto_usuario,
            "foto_usuario_blurhash":usuario.foto_usuario_blurhash,
            "email":usuario.email,
            "pais":usuario.pais,
            "provincia":usuario.provincia,
            "capital":usuario.capital,
            "bairro":usuario.bairro
        } 

        db.session.close()
        
        # Retorna dados + token separado. A rota decide o que fazer com o token
        return {
            "success": True,
            "usuario": usuario_dados,
        }