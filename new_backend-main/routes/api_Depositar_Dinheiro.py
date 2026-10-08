from flask import Blueprint, request, jsonify
from models.database import Carteira_Digital_Depositar, db , Amizade
from flask_cors import cross_origin

Depositar_Dinheiro = Blueprint("Depositar_Dinheiro", __name__)


@Depositar_Dinheiro.route("/depositar_pinheiro", methods=["POST", "OPTIONS"])
@cross_origin(
    origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    supports_credentials=True,
    methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600
)
def DepositarDinheiro():
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({"status": "erro", "message": "Nenhum dado recebido"}), 400

        numero_conta = dados.get("numero_conta")
        valor_sacar_conta = dados.get("valor_sacar_conta")
        id_usuario = dados.get("id_usuario")

        print("📥 Dados recebidos:", dados)  # ← Para debug

        if not all([numero_conta, valor_sacar_conta, id_usuario]):
            return jsonify({"status": "erro", "message": "Campos obrigatórios em falta"}), 400

        
        dados_deposito = {
            "numero_conta":numero_conta,
            "valor_sacar_conta":valor_sacar_conta,   
            "id_usuario":id_usuario
        }
        nova_notificacao = {
            "remetente_id":id_usuario,
            "destinatario_id": id_usuario,
            "valor_deposito":valor_sacar_conta,
            "conta_deposito":numero_conta,
            "tipo_notificacao":"deposito"
        }
        novo_deposito = Carteira_Digital_Depositar(**dados_deposito)
        nova__notificacao = Amizade(**nova_notificacao)
        print("💾 Criando novo depósito:", dados_deposito)  # ← Para debug
        db.session.add(nova__notificacao)
        
        db.session.commit()

        return jsonify({
            "status": "sucesso",
            "message": "Depósito realizado com sucesso"
        }), 200

    except Exception as erro:
        print("❌ ERRO no depósito:", str(erro))   # ← Ver no terminal
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "status": "erro",
            "message": str(erro)
        }), 500