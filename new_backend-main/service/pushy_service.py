import json
import logging
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from models.database import Usuario, db

logger = logging.getLogger(__name__)


def enviar_notificacao_pushy(usuario_id, titulo, mensagem, dados=None):
    from routes.websoket_conectUser import usuarios_online

    if str(usuario_id) in usuarios_online:
        return False

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario:
        logger.warning("Pushy: utilizador destinatário não encontrado.")
        return False
    if not usuario.id_app_usuario_pushy:
        logger.warning("Pushy: destinatário offline sem token de dispositivo registado.")
        return False

    api_key = (os.getenv("PUSHY_API_KEY") or "").strip()
    if not api_key:
        logger.error("Pushy não configurado: defina PUSHY_API_KEY no ambiente do backend.")
        return False

    conteudo = {
        "to": usuario.id_app_usuario_pushy,
        "data": {
            "title": titulo,
            "message": mensagem,
            **(dados or {})
        },
        "notification": {
            "title": titulo,
            "body": mensagem
        },
        "time_to_live": 86400
    }
    requisicao = Request(
        f"https://api.pushy.me/push?{urlencode({'api_key': api_key})}",
        data=json.dumps(conteudo).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urlopen(requisicao, timeout=5) as resposta:
            resultado = json.loads(resposta.read().decode("utf-8"))
            if (
                not isinstance(resultado, dict)
                or not 200 <= resposta.status < 300
                or resultado.get("success") is not True
            ):
                if isinstance(resultado, dict):
                    detalhe = resultado.get("error") or resultado.get("message") or "resposta sem confirmação"
                else:
                    detalhe = "formato de resposta inválido"
                logger.error(
                    "Pushy não confirmou o envio da notificação (HTTP %s): %s",
                    resposta.status,
                    detalhe,
                )
                return False
    except HTTPError as erro:
        detalhe = erro.read().decode("utf-8", errors="replace")
        logger.error("Pushy recusou a notificação (HTTP %s): %s", erro.code, detalhe)
        return False
    except (URLError, TimeoutError) as erro:
        logger.error("Falha ao enviar notificação Pushy: %s", erro)
        return False
    except (json.JSONDecodeError, UnicodeDecodeError) as erro:
        logger.error("Pushy respondeu com conteúdo inválido: %s", erro)
        return False

    return True
