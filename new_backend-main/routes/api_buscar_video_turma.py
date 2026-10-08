from flask import Blueprint , request , jsonify
from models.database import Adicionar_Nova_Aula
from sqlalchemy import desc
Buscar_Video_Turma = Blueprint("buscar_video_turma" , __name__)
@Buscar_Video_Turma.route("/buscar_video_turma/<nome_turma>/<id_admin_turma>" , methods = ["GET"])
def buscar_video_turma(nome_turma , id_admin_turma):
    try:
        videos_turma = Adicionar_Nova_Aula.query.filter(
            Adicionar_Nova_Aula.nome_Turma == nome_turma,
            Adicionar_Nova_Aula.id_admin_Turma == id_admin_turma
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
    
        
