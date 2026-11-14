from routes.api_auth import login_bp
from flask import current_app, jsonify, make_response
from service.security_audit import record_security_event

@login_bp.route("/Logout", methods=["POST"])
def logout():
    record_security_event("auth.logout", {})
    resp = make_response(jsonify({"status": "True", "menssagem": "Deslogado"}))
    cookie_options = {
        "secure": True,
        "httponly": True,
        "samesite": "None",
        "path": "/"
    }
    resp.delete_cookie("token_sessao", **cookie_options)
    resp.delete_cookie("refresh_token", **cookie_options)
    resp.headers["Cache-Control"] = "no-store"
    return resp