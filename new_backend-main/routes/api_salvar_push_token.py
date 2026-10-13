import os

import jwt
from flask import Blueprint, request, jsonify
from models.database import db, Usuario

PushTokenAPI = Blueprint('push_token_api', __name__)

@PushTokenAPI.route('/api/salvar_push_token', methods=['POST'])
def salvar_push_token():
    token_sessao = request.cookies.get('token_sessao')
    if not token_sessao:
        return jsonify({"error": "Autenticação necessária"}), 401

    try:
        payload = jwt.decode(
            token_sessao,
            os.getenv('SECRET_KEY'),
            algorithms=["HS256"]
        )
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Sessão expirada"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Sessão inválida"}), 401

    if payload.get("type") != "access":
        return jsonify({"error": "Sessão inválida"}), 401

    data = request.get_json(silent=True)
    push_token = data.get('push_token') if isinstance(data, dict) else None
    if not isinstance(push_token, str) or not push_token.strip():
        return jsonify({"error": "push_token é obrigatório"}), 400

    usuario = db.session.get(Usuario, payload.get("id"))
    if not usuario:
        return jsonify({"error": "Usuário não encontrado"}), 404

    try:
        usuario.id_app_usuario_pushy = push_token.strip()
        db.session.commit()
    except Exception as erro:
        db.session.rollback()
        print(f"Erro ao salvar token Pushy: {erro}")
        return jsonify({"error": "Não foi possível salvar o token de notificações"}), 500

    return jsonify({"message": "Token Pushy salvo com sucesso"}), 200