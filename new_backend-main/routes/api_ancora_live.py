from flask import request, jsonify, Blueprint
from livekit import api
import os
from dotenv import load_dotenv

load_dotenv()

# Configurações do LiveKit
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_SERVER_URL = os.getenv("LIVEKIT_SERVER_URL")   # Ex: wss://ancora-9rhqr8mo.livekit.cloud

Ancora_Live = Blueprint("Ancora_Live", __name__)

@Ancora_Live.route('/api/livekit/token', methods=['POST'])
def get_livekit_token():
    try:
        data = request.get_json(silent=True) or {}

        room_name = data.get('roomName')
        participant_name = data.get('participantName')
        is_teacher = data.get('isTeacher', False)

        # Validações
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 500

        if not room_name or not participant_name:
            return jsonify({
                "error": "roomName e participantName são obrigatórios"
            }), 400

        # Criação do token
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(participant_name) \
            .with_name(participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                # Partilha de ecrã apenas para professores
                can_publish_sources=["SCREEN_SHARE"] if is_teacher else []
            ))

        return jsonify({
            "token": token.to_jwt(),
            "serverUrl": LIVEKIT_SERVER_URL
        })

    except Exception as e:
        print(f"Erro ao gerar token LiveKit: {str(e)}")  # Para debug no terminal
        return jsonify({"error": "Erro interno ao gerar token"}), 500