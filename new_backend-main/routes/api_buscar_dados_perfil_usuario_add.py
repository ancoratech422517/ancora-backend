from flask import Flask , Blueprint , request , jsonify
from models.database import Amigo ,Registrar_produto , Usuario , Turma_Aula


GetDateUserAdd = Blueprint("getDateUserAdd" , __name__)


@GetDateUserAdd.route("/api/buscar_dados_perfill_add" , methods = ["POST"])
def GETDATEUSERADD():
    try:
        dados = request.get_json()
        id_usuario = dados.get("id_usuario")

        DADOSUSUARIO = []
        DADOSPRODUTO = []
        DADOSTURMA = []
        DADOSTOTALAMIGO = []
        DADOSTOTALPRODUTO = []
        DADOSTOTALTURMAUSUARIO = []
        

        dados_usuario = Usuario.query.filter(
            Usuario.id == id_usuario
        ).all()

        TotalAmigoUsuario = Amigo.query.filter(
            Amigo.id_amigo == id_usuario
        ).count()

        dados_produto = Registrar_produto.query.filter(
            Registrar_produto.id_usuario == id_usuario
        ).all()
        

        TotalProdutoUsuario = Registrar_produto.query.filter(
            Registrar_produto.id_usuario == id_usuario
        ).count()

        dados_turma = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(id_usuario)
        ).all()

        TotalTurmaUsuario = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(id_usuario)
        ).count()

        if dados_usuario:
            for usuario in dados_usuario:
                
                dicionario_geral_usuario = {
                    "nome_usuario":usuario.nome,
                    "pais":usuario.pais,
                    "provincia":usuario.provincia,
                    "capital":usuario.capital,
                    "bairro":usuario.bairro,
                    "id_usuario":usuario.id,
                    "foto_usuario":usuario.foto_usuario
                }
                DADOSUSUARIO.append(dicionario_geral_usuario)

        if TotalAmigoUsuario:
            DADOSTOTALAMIGO.append({"TotalAmigoUsuario":TotalAmigoUsuario})

        if TotalProdutoUsuario:
            DADOSTOTALPRODUTO.append({"TotalProdutoUsuario":TotalProdutoUsuario})

        if dados_produto:
            for produto in dados_produto:
                DADOSPRODUTO.append(
                    {
                        "url_imagem_produto":produto.url_imagem_produto,
                        "id_produto":produto.id
                    }
                )

        if TotalTurmaUsuario:
            DADOSTOTALTURMAUSUARIO.append({"TotalTurmaUsuario":TotalTurmaUsuario})

        if dados_turma:
            for turma in dados_turma:
                TotalAlunoTurma = Turma_Aula.query.filter(
                    Turma_Aula.sala_Turma == turma.sala_Turma
                ).all()
                imagemTurma = Turma_Aula.query.filter(
                    Turma_Aula.tipo_usuario_Turma == "admin",
                    Turma_Aula.nome_Turma == turma.nome_Turma,
                    Turma_Aula.id_admin_Turma == turma.id_admin_Turma
                ).first()
                turma.imagem_perfil_Turma = imagemTurma.imagem_perfil_Turma
                TotalAlunoTurmaResultado = len(TotalAlunoTurma)
                dicionario_geral_turma = {
                    "id_turma":turma.id,
                    "id_admin_Turma":turma.id_admin_Turma,
                    "nome_Turma":turma.nome_Turma,
                    "imagem_perfil_Turma":turma.imagem_perfil_Turma,
                    "TotalAlunoTurmaResultado":TotalAlunoTurmaResultado
                }
                DADOSTURMA.append(dicionario_geral_turma)
        print(DADOSTURMA)
        return jsonify(
            {
                "resposta":"BOAS",
                "DADOSUSUARIO":DADOSUSUARIO,
                "DADOSPRODUTO":DADOSPRODUTO,
                "DADOSTURMA":DADOSTURMA,
                "DADOSTOTALAMIGO":DADOSTOTALAMIGO,
                "DADOSTOTALPRODUTO":DADOSTOTALPRODUTO,
                "DADOSTOTALTURMAUSUARIO":DADOSTOTALTURMAUSUARIO
            }
            )

    except Exception as erro:
        print(f"este é o erro avelino:{erro}")
        return jsonify({"resposta":f"erro ao buscar os dados do perfil:{erro}"})





    


    
