from flask import Blueprint, request, jsonify
from models.database import Adicionar_Nova_Aula, db
import cloudinary
import cloudinary.utils
import os
import time

adicionar_nova_aula = Blueprint("adicionar_nova_aula", __name__)

# Configuração da pasta local (fallback para modo offline)
UPLOAD_FOLDER = 'static/videos_locais'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@adicionar_nova_aula.route("/gerar_assinatura", methods=["GET"])
def gerar_assinatura():
    """Gera a assinatura necessária para upload direto do frontend ao Cloudinary."""
    try:
        timestamp = int(time.time())
        params = {
            "timestamp": timestamp,
            "folder": "video_aulas",
            "resource_type": "video"
        }
        
        # Gera a assinatura usando as credenciais configuradas no app.py
        signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret)
        
        return jsonify({
            "signature": signature,
            "timestamp": timestamp,
            "api_key": cloudinary.config().api_key,
            "cloud_name": cloudinary.config().cloud_name
        }), 200
    except Exception as e:
        return jsonify({"erro": f"Falha ao gerar assinatura: {str(e)}"}), 500

@adicionar_nova_aula.route("/registrar_aula", methods=["POST"])
def registrar_aula():
    """Registra a URL do vídeo no banco de dados após o sucesso do upload direto."""
    try:
        data = request.json
        
        # Validação básica dos dados recebidos
        if not data or 'video_url' not in data:
            return jsonify({"erro": "URL do vídeo não fornecida"}), 400

        nova_aula = Adicionar_Nova_Aula(
            nome_Turma=data.get('nome_turma'),
            id_admin_Turma=data.get('id_admin_turma'),
            tema_video=data.get('tema_video'),
            video=data.get('video_url')
        )
        
        db.session.add(nova_aula)
        db.session.commit()
        
        return jsonify({"mensagem": "Aula registrada com sucesso!"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao registrar aula: {str(e)}"}), 500