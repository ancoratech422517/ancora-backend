from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from models.database import Usuario, db
api_mensagem_privado_autentificacao = Blueprint('api_mensagem_privado_autentificacao', __name__)

@api_mensagem_privado_autentificacao.route('/api/mensagem_privado_autentificacao', methods=['POST'])
def mensagem_privado_autentificacao():
    try:
        data = request.get_json()
        telefone = data.get('telefone_credencias')
        senha = data.get('senha_credencias')

        usuario = Usuario.query.filter_by(telefone=telefone).first()
        if not usuario or not check_password_hash(usuario.senha_hash, senha):
            return jsonify({"resposta": False, "message": "Credenciais inválidas"}), 401
        
        return jsonify({"resposta": True, "message": "Credenciais válidas"}), 200
        
    except Exception as e:
        return jsonify({"resposta": False, "message": str(e)}), 500
        
    
    

    
