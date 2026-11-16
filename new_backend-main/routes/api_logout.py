from routes.api_auth import login_bp
from flask import current_app, g, jsonify, make_response, request
from service.refresh_sessions import revoke_refresh_token
from service.security_audit import record_security_event
from service.security_tokens import request_origin_is_allowed

@login_bp.route("/Logout", methods=["POST"])
def logout():
    if request.headers.get("Origin") and not request_origin_is_allowed():
        return jsonify({"erro": "Origem não autorizada"}), 403

    user_id = int(g.principal["sub"])
    refresh_token = request.cookies.get("refresh_token")
    revoke_failed = False
    if refresh_token:
        try:
            revoke_refresh_token(refresh_token, user_id)
        except Exception:
            current_app.logger.exception("Erro ao revogar refresh token no logout")
            revoke_failed = True

    record_security_event("auth.logout", {"user_id": user_id})
    resp = make_response(jsonify({"status": "True", "menssagem": "Deslogado"}))
    if revoke_failed:
        resp = make_response(jsonify({"status": "False", "menssagem": "Erro ao terminar sessão"}), 503)
    cookie_options = {
        "secure": True,
        "httponly": True,
        "samesite": "None",
        "path": "/"
    }
    resp.delete_cookie("token_sessao", **cookie_options)
    resp.delete_cookie("refresh_token", **cookie_options)
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["Pragma"] = "no-cache"
    return resp
