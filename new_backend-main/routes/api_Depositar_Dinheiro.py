from flask import Blueprint, jsonify


Depositar_Dinheiro = Blueprint("Depositar_Dinheiro", __name__)


@Depositar_Dinheiro.route("/depositar_pinheiro", methods=["POST"])
def DepositarDinheiro():
    # Deposits must remain disabled until a payment provider verifies the
    # transaction server-to-server. Client-submitted amounts are not proof of payment.
    return jsonify({
        "status": "indisponível",
        "message": "Depósitos temporariamente indisponíveis até configurar a confirmação de pagamento.",
    }), 503
