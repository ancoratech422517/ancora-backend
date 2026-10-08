from flask import Blueprint , request , jsonify
from models.database import Turma_Aula , db , Usuario
from routes.websoket_conectUser import usuarios_online

Buscar_Aluno_Turma = Blueprint("Buscar_ALuno_Turma" , __name__)
@Buscar_Aluno_Turma.route("/buscar_aluno_turma/<nome_Turma>/<id_admin_Turma>" , methods = ["GET"])
def buscar_aluno_turma(nome_Turma , id_admin_Turma):
    try:
        buscar_os_alunos = Turma_Aula.query.filter(
            Turma_Aula.nome_Turma == nome_Turma,
            Turma_Aula.id_admin_Turma == int(id_admin_Turma)
        ).all()
        
        total_de_alunos =  Turma_Aula.query.filter(
            Turma_Aula.nome_Turma == nome_Turma,
            Turma_Aula.id_admin_Turma == int(id_admin_Turma)
        ).count()

        if not buscar_os_alunos:
            print("nenum aluno registrado nesta turma")
            return jsonify([{}])
        Alunos = []
        total_online = 0
        for aluno in buscar_os_alunos:
            dados_aluno = Usuario.query.filter(
                Usuario.id == int(aluno.id_aluno_Turma)
            ).first()
            status = "Online" if str(aluno.id_aluno_Turma) in usuarios_online else "Offline"
            if status == "Online":
                total_online = total_online + 1
            dados = {
                "nome_aluno":dados_aluno.nome,
                "telefone_aluno":dados_aluno.telefone,
                "email_aluno":dados_aluno.email,
                "foto_aluno":dados_aluno.foto_usuario,
                "id_aluno":dados_aluno.id,
                "status":status,
                "total_aluno":total_de_alunos,
                "total_aluno_online":total_online,
                "sala_Turma":aluno.sala_Turma,
                "nome_Turma":aluno.nome_Turma,
                "id_admin_turma":aluno.id_admin_Turma
            }

            Alunos.append(dados)
        return jsonify(Alunos)
    except Exception as erro:
        print(f"erro ao buscar os alunos da turma:{erro}")
        return jsonify({"resposta":erro})
 

