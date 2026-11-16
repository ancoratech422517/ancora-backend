from flask import Blueprint, current_app, request, jsonify, make_response
from service.auth_service import AuthService
from ancorashield.exceptions import AuthenticationError
from models.database import Usuario, db
from service.security_audit import record_security_event
from service.refresh_sessions import issue_and_store_refresh_token, rotate_refresh_token
from service.security_tokens import (
    issue_access_token,
    refresh_token_manager,
    request_origin_is_allowed,
)

login_bp = Blueprint("login", __name__)

FRONTEND_URL = "https://ancora-oficial-ao.netlify.app"


# =========================
# 🔐 LOGIN
# =========================
@login_bp.route("/Login", methods=["POST"])
def Login():
    try:
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({
                "status": "False",
                "menssagem": "Dados de login inválidos",
            }), 400
        telefone = dados.get("telefone")
        senha = dados.get("senha")
        if (
            not isinstance(telefone, str)
            or not telefone.strip()
            or len(telefone) > 32
            or not isinstance(senha, str)
            or not senha
            or len(senha) > 128
        ):
            return jsonify({
                "status": "False",
                "menssagem": "Telefone ou senha inválidos",
            }), 400

        resultado = AuthService.validar_login(telefone, senha)

        if not resultado:
            record_security_event("auth.login.failed", {})
            return jsonify({
                "menssagem": "Telefone ou senha inválidos",
                "status": "False"
            }), 401

        usuario = resultado["usuario"]
        user_id = usuario["id"]
        record_security_event("auth.login.succeeded", {"user_id": user_id})
        

        access_token = issue_access_token(user_id)
        refresh_token = issue_and_store_refresh_token(user_id)

        resp = make_response(jsonify({
            "status": "True",
            "menssagem": "usuario logado!",
            "access_token": access_token,
            "expires_in": 900,
            "id": user_id,
            "nome": usuario["nome"],
            "telefone": usuario["telefone"],
            "foto_usuario":usuario["foto_usuario"],
            "foto_usuario_blurhash":usuario["foto_usuario_blurhash"],
            "email":usuario["email"],
            "pais":usuario["pais"],
            "provincia":usuario["provincia"],
            "capital":usuario["capital"],
            "bairro":usuario["bairro"],

        }))
        resp.delete_cookie(
            "token_sessao",
            secure=True,
            httponly=True,
            samesite="None",
            path="/",
        )
        resp.headers["Cache-Control"] = "no-store"
        resp.headers["Pragma"] = "no-cache"

        resp.set_cookie(
            "refresh_token",
            refresh_token,
            max_age=60 * 60 * 24 * 7,
            httponly=True,
            secure=True,
            samesite="None",
            path="/"
        )

        return resp

    except Exception:
        current_app.logger.exception("Erro no login")
        return jsonify({
            "status": "False",
            "menssagem": "Erro interno"
        }), 500


# =========================
# 🔄 REFRESH TOKEN (MESMO BLUEPRINT)
# =========================
@login_bp.route("/refresh", methods=["POST"])
def refresh():
    if not request_origin_is_allowed():
        return jsonify({"erro": "Origem não autorizada"}), 403

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return jsonify({"erro": "Sem refresh token"}), 401

    try:
        payload = refresh_token_manager().verify(refresh_token)
    except AuthenticationError:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    roles = payload.get("roles")
    if (
        payload.get("token_type") != "refresh"
        or not isinstance(roles, (list, tuple, set, frozenset))
        or "refresh" not in roles
    ):
        return jsonify({"erro": "Token inválido"}), 401

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"erro": "Token inválido"}), 401

    usuario = db.session.get(Usuario, user_id)
    if not usuario:
        return jsonify({"erro": "Utilizador não encontrado"}), 401

    try:
        rotated_refresh_token = rotate_refresh_token(refresh_token, user_id)
    except Exception:
        current_app.logger.exception("Erro ao rodar refresh token")
        return jsonify({"erro": "Erro interno"}), 500
    if not rotated_refresh_token:
        return jsonify({"erro": "Refresh token revogado ou já utilizado"}), 401

    record_security_event("auth.token.refreshed", {"user_id": user_id})
    response = make_response(jsonify({
        "access_token": issue_access_token(usuario.id),
        "expires_in": 900,
    }))
    response.set_cookie(
        "refresh_token",
        rotated_refresh_token,
        max_age=60 * 60 * 24 * 7,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    return response, 200
