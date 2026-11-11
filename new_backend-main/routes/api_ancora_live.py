from flask import request, jsonify, Blueprint
from livekit import api
import os
from uuid import UUID
from dotenv import load_dotenv
from models.database import Amigo, Usuario

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

        # Validações
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET or not LIVEKIT_SERVER_URL:
            return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 500

        if not room_name or not participant_name or participant_id is None or not str(participant_id).strip():
            return jsonify({
                "error": "roomName, participantName e participantId são obrigatórios"
            }), 400

        # Criação do token
        publish_sources = [
            "microphone",
            "camera",
            "screen_share",
            "screen_share_audio",
        ]

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


@Ancora_Live.route('/api/livekit/call-token', methods=['POST'])
def get_livekit_call_token():
    try:
        from routes.websoket_conectUser import get_user_id_from_cookie

        usuario_id = get_user_id_from_cookie()
        if not usuario_id:
            return jsonify({"error": "Autenticação necessária"}), 401

        data = request.get_json(silent=True) or {}
        room_name = data.get("roomName")
        peer_id = data.get("peerId")
        call_type = str(data.get("callType") or data.get("call_type") or "voice").lower()
        try:
            call_id = str(UUID(str(data.get("callId"))))
        except (TypeError, ValueError, AttributeError):
            return jsonify({"error": "Identificador de chamada inválido"}), 400

        if room_name != f"voice-{call_id}" or peer_id is None:
            return jsonify({"error": "Sala ou participante inválido"}), 400

        amizade = Amigo.query.filter(
            ((Amigo.id_usuario == usuario_id) & (Amigo.id_amigo == peer_id))
            | ((Amigo.id_usuario == peer_id) & (Amigo.id_amigo == usuario_id))
        ).first()
        if not amizade:
            return jsonify({"error": "A chamada só pode ocorrer entre amigos"}), 403

        bloqueios = {
            f"bloquear_usuario_{usuario_id}",
            f"bloquear_usuario_{peer_id}",
        }
        if bloqueios.intersection({
            amizade.condicao_estado_Bloqueado1,
            amizade.condicao_estado_Bloqueado2,
        }):
            return jsonify({"error": "Não é possível ligar para este usuário"}), 403

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuário não encontrado"}), 404
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET or not LIVEKIT_SERVER_URL:
            return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 500

        publish_sources = ["microphone"]
        if call_type == "video":
            publish_sources.append("camera")

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(f"user-{str(usuario_id).strip()}") \
            .with_name(usuario.nome) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                can_publish_sources=publish_sources,
            ))

        return jsonify({"token": token.to_jwt(), "serverUrl": LIVEKIT_SERVER_URL})
    except Exception as erro:
        print(f"Erro ao gerar token de chamada LiveKit: {erro}")
        return jsonify({"error": "Erro interno ao gerar token de chamada"}), 500