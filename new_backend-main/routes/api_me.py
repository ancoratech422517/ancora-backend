from flask import g, jsonify
from models.database import Usuario, db
from routes.api_auth import login_bp

@login_bp.route("/api/me", methods=["GET"])
def get_me():
    try:
        usuario_id = int(g.principal["sub"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"status": "False"}), 401

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario:
        return jsonify({"status": "False"}), 401

    return jsonify({
        "status": "True",
        "id": usuario.id,
        "nome": usuario.nome,
        "telefone": usuario.telefone,
        "foto_usuario": usuario.foto_usuario,
        "foto_usuario_blurhash": usuario.foto_usuario_blurhash,
        "email": usuario.email,
        "data_nascimento": usuario.data_nascimento,
        "continente": usuario.continente,
        "pais": usuario.pais,
        "provincia": usuario.provincia,
        "capital": usuario.capital,
        "bairro": usuario.bairro,
    })