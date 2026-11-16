from flask import Blueprint, jsonify


Send_trafego_dados = Blueprint("send_trafego_dados", __name__)


@Send_trafego_dados.route("/send_dados_trafego", methods=["POST"])
def SendTrafegoDados():
    # Campaign spend must not be recorded as paid until a provider confirms it.
    return jsonify({
        "status": "indisponível",
        "message": "Campanhas pagas temporariamente indisponíveis até configurar a confirmação de pagamento.",
    }), 503
