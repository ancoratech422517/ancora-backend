from flask import Blueprint , request , jsonify
from models.database import Usuario , Amigo , Registrar_produto , Turma_Aula

Buscar_Dados_Perfil_Usuario = Blueprint("buscar_dados_perfil_usuario" , __name__)

@Buscar_Dados_Perfil_Usuario.route("/api/buscar_dados_perfil_usuario" , methods = ["POST"])
def buscar_dados_perfil_usuario():
    try:
        data = request.get_json()
        id_usuario = data.get("id_usuario")
        dados_user = Usuario.query.filter(
            Usuario.id == id_usuario
        ).all()

        Total_Amigo_user = Amigo.query.filter(
            str(Amigo.id_usuario) == str(id_usuario)
        ).count()

        dados_produto_user = Registrar_produto.query.filter(
            str(Registrar_produto.id_usuario) == str(id_usuario)
        ).all()

        dados_turma_user = Turma_Aula.query.filter(
            str(Turma_Aula.id_aluno_Turma) == str(id_usuario)
        ).all()

        total_turma_usuario = len(dados_turma_user)
        if dados_user:
            for x in dados_user:
                todos_dados_user = {
                    "nome_usuario":x.nome,
                    "foto_usuario":x.foto_usuario,
                    "pais_usuario":x.pais,
                    "provincia_usuario":x.provincia,
                    "capital_usuario":x.capital,
                    "total_amigo_usuario":Total_Amigo_user,
                    "dados_produto_usuario":dados_produto_user,
                    "total_turma_usuario":total_turma_usuario,
                    "dados_turma_usuario":dados_turma_user
                }
                return jsonify({"dados_usuario":todos_dados_user , "resposta":"sucesso!"})
        else:
            return jsonify({"dados_usuario":[], "resposta":"infelizmente não tem nenhum usuario com este ID"})

    except Exception as erro:
        print(f"erro ao buscar os dados do perfil do usuario:{erro}")
        return jsonify({"dados_usuario":{} , "resposta":f"ouve um erro aveçino:{erro}"})
    



        



    
