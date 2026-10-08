from flask import Blueprint, request, jsonify
from models.database import db, Turma_Aula
import cloudinary.uploader
from models.database import Amigo
import os

api_validar_registro_turma = Blueprint('api_validar_registro_turma', __name__)  

@api_validar_registro_turma.route('/validar-registro-turma', methods=['POST'])
def validar_registro_turma():
    nome_turma = request.form.get("nome_turma")
    imagem_turma = request.files.get("img_turma")
    id_admin = request.form.get("id_admin")
    novo_nome_turma = nome_turma.replace(" " , "_")
    sala_turma = f"Turma_{id_admin}_admin_{novo_nome_turma}"
    if not nome_turma or not imagem_turma or not id_admin:
        return jsonify({"error": "Todos os campos são obrigatórios."}), 400
    
    novo_nome_imagem = imagem_turma.filename.replace(" ", "_")
    
    dados = {
        "nome_Turma": nome_turma,
        "id_admin_Turma": id_admin,
        "tipo_usuario_Turma": "admin",
        "id_aluno_Turma": id_admin,
        "sala_Turma":sala_turma,
    }
    dados_sala = {
        "id_usuario":id_admin,
        "id_amigo":id_admin,
        "nossa_sala":sala_turma
    }

    try:
        # Passar o objeto imagem_turma direto (sem .read()) é mais seguro
        upload_result = cloudinary.uploader.upload(                
            imagem_turma,
            folder="usuario/turmas",    
            overwrite=True,
            resource_type="image"
        )
        dados["imagem_perfil_Turma"] = upload_result.get("secure_url")
        dados_sala["foto_amigo"] = upload_result.get("secure_url")

        nova_turma = Turma_Aula(**dados)
        db.session.add(nova_turma)
        db.session.commit()
        return jsonify({"message": "Turma criada com sucesso no Cloudinary."}), 200

    except Exception as e:
        print(f"Erro ao enviar imagem para Cloudinary: {e}")
        
        try:
            # CORREÇÃO CRUCIAL: Reseta o ponteiro do arquivo para o início
            imagem_turma.seek(0)
            
            caminho = "static/turmas/"
            caminho_local = os.path.join(caminho, novo_nome_imagem)
            
            if not os.path.exists(caminho):
                os.makedirs(caminho)

            # Salva o arquivo localmente agora que o ponteiro foi resetado
            imagem_turma.save(caminho_local)
            
            dados["imagem_perfil_Turma"] = f"http://127.0.0.1:5000/{caminho_local}"
            dados_sala["foto_amigo"] = f"http://127.0.0.1:5000/{caminho_local}"
            
            nova_turma = Turma_Aula(**dados)
            db.session.add(nova_turma)  
            db.session.commit()
            return jsonify({"message": "Turma criada com sucesso (Backup Local)."}), 200

        except Exception as e_local:
            print(f"Erro ao salvar imagem localmente: {e_local}")
            return jsonify({"error": "Falha ao processar a imagem localmente."}), 500