from flask import Blueprint, jsonify, request
from models.database import Turma_Aula, Usuario
from routes.websoket_conectUser import usuarios_online

Buscar_Aluno_Turma = Blueprint("Buscar_ALuno_Turma" , __name__)


@Buscar_Aluno_Turma.route("/buscar_aluno_turma", methods=["GET"])
@Buscar_Aluno_Turma.route(
    "/buscar_aluno_turma/<path:nome_Turma>/<int:id_admin_Turma>",
    methods=["GET"]
)
def buscar_aluno_turma(nome_Turma=None, id_admin_Turma=None):
    try:
        nome_Turma = nome_Turma or request.args.get("nome_Turma", "").strip()
        id_admin_Turma = id_admin_Turma or request.args.get("id_admin_Turma")
        if not nome_Turma or not id_admin_Turma:
            return jsonify({"error": "Nome da turma e administrador são obrigatórios."}), 400

        try:
            id_admin_Turma = int(id_admin_Turma)
        except (TypeError, ValueError):
            return jsonify({"error": "Identificador do administrador inválido."}), 400

        buscar_os_alunos = Turma_Aula.query.filter(
            Turma_Aula.nome_Turma == nome_Turma,
            Turma_Aula.id_admin_Turma == id_admin_Turma
        ).all()

        if not buscar_os_alunos:
            return jsonify([])

        ids_alunos = set()
        for aluno in buscar_os_alunos:
            try:
                ids_alunos.add(int(aluno.id_aluno_Turma))
            except (TypeError, ValueError):
                continue

        usuarios_por_id = {
            usuario.id: usuario
            for usuario in Usuario.query.filter(Usuario.id.in_(ids_alunos)).all()
        } if ids_alunos else {}

        alunos = []
        for aluno in buscar_os_alunos:
            try:
                id_aluno = int(aluno.id_aluno_Turma)
            except (TypeError, ValueError):
                continue
            dados_aluno = usuarios_por_id.get(id_aluno)
            if not dados_aluno:
                continue

            status = "Online" if str(id_aluno) in usuarios_online else "Offline"
            dados = {
                "nome_aluno": dados_aluno.nome,
                "telefone_aluno": dados_aluno.telefone,
                "email_aluno": dados_aluno.email,
                "foto_aluno": dados_aluno.foto_usuario,
                "foto_aluno_blurhash": dados_aluno.foto_usuario_blurhash,
                "id_aluno": dados_aluno.id,
                "status": status,
                "sala_Turma": aluno.sala_Turma,
                "nome_Turma": aluno.nome_Turma,
                "id_admin_turma": aluno.id_admin_Turma
            }

            alunos.append(dados)

        total_de_alunos = len(alunos)
        total_online = sum(aluno["status"] == "Online" for aluno in alunos)
        for aluno in alunos:
            aluno["total_aluno"] = total_de_alunos
            aluno["total_aluno_online"] = total_online

        return jsonify(alunos)
    except Exception as erro:
        print(f"erro ao buscar os alunos da turma:{erro}")
        return jsonify({"error": "Erro ao buscar alunos da turma."}), 500
 
