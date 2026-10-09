from flask import Blueprint, request, jsonify
from models.database import db, Turma_Aula
turma_usuario = Blueprint("turma_usuario", __name__)

@turma_usuario.route("/buscar_turma_usuario/<int:userId>", methods=["GET"] )
def buscar_turma_usuario(userId):
    try:
        turmas = Turma_Aula.query.filter(
            Turma_Aula.id_aluno_Turma == str(userId)
        ).all()
        resultado = []
        for turma in turmas:

            imagem_turma = Turma_Aula.query.filter(
                Turma_Aula.tipo_usuario_Turma == "admin",
                Turma_Aula.nome_Turma == turma.nome_Turma,
                Turma_Aula.id_admin_Turma == turma.id_admin_Turma
            ).first()

            imagem_atual = imagem_turma.imagem_perfil_Turma
            resultado.append({
                "id": turma.id,
                "nome_Turma": turma.nome_Turma,
                "imagem_perfil_Turma": imagem_atual,
                "id_admin_Turma": turma.id_admin_Turma,
                "tipo_usuario_Turma": turma.tipo_usuario_Turma,
                "id_aluno_Turma": turma.id_aluno_Turma,
                "sala_Turma": turma.sala_Turma
            })
        return jsonify(resultado), 200
    except Exception as e:
        print(f"Erro ao buscar turmas do usuário: {e}")
        return jsonify({"error": "Erro ao buscar turmas do usuário."}), 500
    
