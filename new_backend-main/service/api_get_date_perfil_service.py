from flask import jsonify
from models.database import Usuario, db


class date_perfil:
    @staticmethod
    def dataPerfil(usuario_id):
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario:
            return jsonify({"menssagem": "usuario não encontrado!"}), 404

        return jsonify({
            "status": "True",
            "nome": usuario.nome,
            "telefone": usuario.telefone,
            "id": usuario.id,
            "foto_usuario": usuario.foto_usuario,
        }), 200