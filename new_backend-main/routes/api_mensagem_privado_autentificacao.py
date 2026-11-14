from flask import Blueprint, current_app, g, request, jsonify
from models.database import Usuario, db
from service.phone_number import normalizar_telefone
from service.password_security import verify_password_and_upgrade
api_mensagem_privado_autentificacao = Blueprint('api_mensagem_privado_autentificacao', __name__)

@api_mensagem_privado_autentificacao.route('/api/mensagem_privado_autentificacao', methods=['POST'])
def mensagem_privado_autentificacao():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"resposta": False, "message": "Dados inválidos"}), 400
        usuario_id = int(g.principal["sub"])
        telefone = normalizar_telefone(data.get('telefone_credencias'))
        senha = data.get('senha_credencias')
        usuario = db.session.get(Usuario, usuario_id)
        if not usuario or usuario.telefone != telefone:
            return jsonify({"resposta": False, "message": "Credenciais inválidas"}), 401

        if not verify_password_and_upgrade(usuario, senha):
            return jsonify({"resposta": False, "message": "Credenciais inválidas"}), 401
        
        return jsonify({"resposta": True, "message": "Credenciais válidas"}), 200
        
    except (TypeError, ValueError):
        return jsonify({"resposta": False, "message": "Credenciais inválidas"}), 401
    except Exception:
        current_app.logger.exception("Falha na reautenticação de mensagens privadas")
        return jsonify({"resposta": False, "message": "Erro interno"}), 500
        
    
    

    
