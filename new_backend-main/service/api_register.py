from models.api_register_db import RegisterService
from service.phone_number import normalizar_telefone
models = RegisterService()

class register_user():
    def registrar_usuario(self , 
                          nome=None , 
                          telefone=None , 
                          senha=None , 
                          confirmar_senha=None , 
                          email = None , 
                          data_nascimento = None , 
                          foto = None,
                          foto_blurhash = None,
                          continente = None,
                          pais = None , 
                          provincia = None,
                          capital = None,
                          bairro = None
                          ):
        telefone = normalizar_telefone(telefone)

        if not senha:
            return {"status": False, "message": "Senha inválida."}, 400
        elif len(senha) < 6:
            return {"status": False, "message": "A senha deve ter pelo menos 6 caracteres."}, 400
        elif senha != confirmar_senha:
            return {"status": False, "message": "As senhas não coincidem."}, 400
        elif not nome:
            return {"status": False, "message": "O nome é obrigatório."}, 400
        elif not telefone:
            return {"status": False, "message": "O telefone é obrigatório."}, 400
        else:
            dados = {
                "nome":nome,
                "telefone":telefone,
                "senha":senha,
                # "confirmar_senha":confirmar_senha,
                "email":email,
                "data_nascimento":data_nascimento,
                "foto_usuario":foto,
                "foto_usuario_blurhash":foto_blurhash,
                "continente":continente,
                "pais":pais,
                "provincia":provincia,
                "capital":capital,
                "bairro":bairro
            }
            resultado, status_code = models.registrar_user_in_db(**dados)
            if status_code != 201:
                return {
                    "status": False,
                    "message": resultado.get("erro", "Não foi possível criar a conta."),
                }, status_code

            return {
                "status": True,
                "message": "Conta criada com sucesso.",
            }, status_code