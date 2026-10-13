import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from models.database import Usuario, db


def enviar_notificacao_pushy(usuario_id, titulo, mensagem, dados=None):
    from routes.websoket_conectUser import usuarios_online

    if str(usuario_id) in usuarios_online:
        return False

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario or not usuario.id_app_usuario_pushy:
        return False

    api_key = os.getenv("PUSHY_API_KEY")
    if not api_key:
        print("Pushy não configurado: defina PUSHY_API_KEY no ambiente do backend.")
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
            if not 200 <= resposta.status < 300:
                print(f"Pushy recusou a notificação: HTTP {resposta.status}")
                return False
    except HTTPError as erro:
        detalhe = erro.read().decode("utf-8", errors="replace")
        print(f"Pushy recusou a notificação: HTTP {erro.code}: {detalhe}")
        return False
    except (URLError, TimeoutError) as erro:
        print(f"Falha ao enviar notificação Pushy: {erro}")
        return False

    return True
