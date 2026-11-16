from flask import Blueprint, g, jsonify
from models.database import Adicionar_Nova_Aula
from sqlalchemy import desc
from service.turma_access import user_is_turma_member
Buscar_Video_Turma = Blueprint("buscar_video_turma" , __name__)
@Buscar_Video_Turma.route("/buscar_video_turma/<nome_turma>/<id_admin_turma>" , methods = ["GET"])
def buscar_video_turma(nome_turma , id_admin_turma):
    try:
        try:
            user_id = int(g.principal["sub"])
            admin_id = int(id_admin_turma)
        except (KeyError, TypeError, ValueError):
            return jsonify({"error": "Sessão ou turma inválida"}), 401
        if not user_is_turma_member(user_id, admin_id, nome_turma):
            return jsonify({"error": "Sem acesso a esta turma"}), 403
        videos_turma = Adicionar_Nova_Aula.query.filter(
            Adicionar_Nova_Aula.nome_Turma == nome_turma,
            Adicionar_Nova_Aula.id_admin_Turma == admin_id
        ).order_by(Adicionar_Nova_Aula.id.desc()).all()
        
        if not videos_turma:
            print("nenhum video nesta turma")
            return jsonify([])
        else:
            videos = []
            for video in videos_turma:
                item = {
                    "nome_turma":video.nome_Turma,
                    "id_admin_turma":video.id_admin_Turma,
                    "url_video":video.video,
                    "tema_video":video.tema_video
                }
                videos.append(item)
            print("videos carregados com sucesso!")
            return jsonify(videos)
    except Exception as erro:

        print(f"erro ao carregar os videos:{erro}")
        return jsonify({"resposta":f"erro ao carregar os videos:{erro}"})
    
        
