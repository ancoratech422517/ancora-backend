import os
from uuid import UUID

from dotenv import load_dotenv
from flask import Blueprint, current_app, g, jsonify, request
from livekit import api

from models.database import Turma_Aula, Usuario, db
from service.friend_access import user_can_view_friend_status
from service.turma_access import user_is_turma_member


load_dotenv()

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_SERVER_URL = os.getenv("LIVEKIT_SERVER_URL")

Ancora_Live = Blueprint("Ancora_Live", __name__)


def _current_user():
    try:
        user_id = int(g.principal["sub"])
    except (AttributeError, KeyError, TypeError, ValueError):
        return None
    return db.session.get(Usuario, user_id)


def _livekit_configured():
    return bool(LIVEKIT_API_KEY and LIVEKIT_API_SECRET and LIVEKIT_SERVER_URL)


@Ancora_Live.route("/api/livekit/token", methods=["POST"])
def get_livekit_token():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Sessão inválida"}), 401

    data = request.get_json(silent=True)
    room_name = data.get("roomName") if isinstance(data, dict) else None
    if not isinstance(room_name, str) or not room_name.strip() or len(room_name) > 200:
        return jsonify({"error": "Sala inválida"}), 400
    room_name = room_name.strip()

    turma = Turma_Aula.query.filter_by(
        sala_Turma=room_name,
        tipo_usuario_Turma="admin",
    ).first()
    if turma is None or not user_is_turma_member(
        user.id, int(turma.id_admin_Turma), turma.nome_Turma
    ):
        return jsonify({"error": "Não tens acesso a esta live"}), 403
    if not _livekit_configured():
        return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 503

    is_teacher = int(turma.id_admin_Turma) == user.id
    publish_sources = ["microphone", "camera"]
    if is_teacher:
        publish_sources.extend(["screen_share", "screen_share_audio"])

    try:
        token = (
            api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(f"user-{user.id}")
            .with_name(user.nome)
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                can_publish_sources=publish_sources,
            ))
        )
        return jsonify({"token": token.to_jwt(), "serverUrl": LIVEKIT_SERVER_URL})
    except Exception:
        current_app.logger.exception("Falha ao gerar token LiveKit de turma")
        return jsonify({"error": "Não foi possível preparar a ligação à live"}), 500


@Ancora_Live.route("/api/livekit/call-token", methods=["POST"])
def get_livekit_call_token():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Sessão inválida"}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Dados da chamada inválidos"}), 400
    try:
        call_id = str(UUID(str(data.get("callId"))))
        peer_id = int(data.get("peerId"))
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Identificador de chamada inválido"}), 400

    room_name = data.get("roomName")
    call_type = str(data.get("callType") or data.get("call_type") or "voice").lower()
    if (
        user.id == peer_id
        or room_name != f"voice-{call_id}"
        or call_type not in {"voice", "video"}
    ):
        return jsonify({"error": "Sala ou participante inválido"}), 400
    if not user_can_view_friend_status(user.id, peer_id):
        return jsonify({"error": "A chamada só pode ocorrer entre amigos sem bloqueio"}), 403
    if not _livekit_configured():
        return jsonify({"error": "Configuração do LiveKit incompleta no servidor"}), 503

    publish_sources = ["microphone"]
    if call_type == "video":
        publish_sources.extend(["camera", "screen_share", "screen_share_audio"])
    try:
        token = (
            api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(f"user-{user.id}")
            .with_name(user.nome)
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                can_publish_sources=publish_sources,
            ))
        )
        return jsonify({"token": token.to_jwt(), "serverUrl": LIVEKIT_SERVER_URL})
    except Exception:
        current_app.logger.exception("Falha ao gerar token LiveKit de chamada")
        return jsonify({"error": "Não foi possível preparar a chamada"}), 500
