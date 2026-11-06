from routes.api_auth import login_bp
from flask import jsonify , make_response

@login_bp.route("/Logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"status": "True", "menssagem": "Deslogado"}))
    cookie_options = {
        "secure": True,
        "httponly": True,
        "samesite": "None",
        "path": "/"
    }
    resp.delete_cookie("token_sessao", **cookie_options)
    resp.delete_cookie("refresh_token", **cookie_options)
    return resp