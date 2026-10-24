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
        participant_id = data.get('participantId')
        is_teacher = data.get('isTeacher', False)

        # Validações
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET or not LIVEKIT_SERVER_URL:
            return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 500

        if not room_name or not participant_name or participant_id is None or not str(participant_id).strip():
            return jsonify({
                "error": "roomName, participantName e participantId são obrigatórios"
            }), 400

        # Criação do token
        publish_sources = ["microphone", "camera"]
        if is_teacher:
            publish_sources.extend(["screen_share", "screen_share_audio"])

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(f"user-{str(participant_id).strip()}") \
            .with_name(participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                can_publish_sources=publish_sources,
            ))

        return jsonify({
            "token": token.to_jwt(),
            "serverUrl": LIVEKIT_SERVER_URL
        })

    except Exception as e:
        print(f"Erro ao gerar token LiveKit: {str(e)}")  # Para debug no terminal
        return jsonify({"error": "Erro interno ao gerar token"}), 500