import json
import logging
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from models.database import Usuario, db

logger = logging.getLogger(__name__)
PUSHY_NOTIFICATION_ICON = "https://ancora-ecommerc-tawny.vercel.app/logo2.png"
FRONTEND_PUBLIC_URL = os.getenv("FRONTEND_URL") or "https://ancora-ecommerc-tawny.vercel.app"
PUSHY_ATTACHMENT_ICONS = {
    "imagem": "image.svg",
    "audio": "audio.svg",
    "video": "video.svg",
    "ficheiro": "file.svg",
}


def _imagem_url_valida(url):
    if not url or not isinstance(url, str):
        return False

    valor = url.strip()
    if not valor or valor.lower() in {"none", "null", "undefined"}:
        return False

    try:
        parsed = urlparse(valor)
        if valor.startswith("data:"):
            return True
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def _normalizar_url_imagem(url):
    if not url or not isinstance(url, str):
        return ""

    valor = url.strip()
    if not valor or valor.lower() in {"none", "null", "undefined"}:
        return ""

    if valor.startswith(("http://", "https://", "data:")):
        return valor if _imagem_url_valida(valor) else ""

    if valor.startswith("/"):
        valor_publico = f"{FRONTEND_PUBLIC_URL.rstrip('/')}{valor}"
        return valor_publico if _imagem_url_valida(valor_publico) else ""

    valor_publico = f"{FRONTEND_PUBLIC_URL.rstrip('/')}/{valor.lstrip('/')}"
    return valor_publico if _imagem_url_valida(valor_publico) else ""


def _resolver_icone_pushy(dados=None):
    if not isinstance(dados, dict):
        print("[PUSHY] URL da imagem do usuário não encontrada: payload de push inválido.")
        logger.warning("Pushy: payload de push inválido para ícone. Usando logo padrão.")
        return PUSHY_NOTIFICATION_ICON

    candidatos = [
        dados.get("icon"),
        dados.get("image"),
        dados.get("icon_url"),
        dados.get("foto_usuario"),
        dados.get("foto_remitente"),
        dados.get("foto_usuario_solicitante"),
    ]

    for valor in candidatos:
        url = _normalizar_url_imagem(valor)
        if url:
            return url

    sender_id = (
        dados.get("sender_id")
        or dados.get("id_remitente")
        or dados.get("id_usuario_solicitante")
    )

    if sender_id:
        remetente = db.session.get(Usuario, sender_id)
        if remetente:
            print(f"[PUSHY] Verificando foto do remetente no banco. sender_id={sender_id}, foto_usuario={remetente.foto_usuario!r}")
            if remetente.foto_usuario:
                url = _normalizar_url_imagem(remetente.foto_usuario)
                if url:
                    return url

    print(
        "[PUSHY] URL da imagem do usuário não encontrada. "
        f"sender_id={sender_id}, dados={dados}"
    )
    logger.warning(
        "Pushy: URL da imagem do usuário não encontrada. "
        "Usando logo padrão da plataforma. sender_id=%s dados=%s",
        sender_id,
        dados,
    )
    return PUSHY_NOTIFICATION_ICON


def _formatar_previa_mensagem(mensagem, dados):
    if not isinstance(dados, dict):
        return mensagem, None

    conteudo = {}
    mensagem_audio = isinstance(mensagem, str) and mensagem.startswith("data:audio/")
    if isinstance(mensagem, str) and not mensagem_audio:
        try:
            parsed = json.loads(mensagem)
            if isinstance(parsed, dict):
                conteudo = parsed
        except (TypeError, ValueError):
            pass

    eh_arquivo = dados.get("message_type") == "arquivo" or conteudo.get("isFile")
    if not eh_arquivo and not mensagem_audio:
        return mensagem, None

    nome = str(dados.get("file_name") or conteudo.get("fileName") or "").strip()
    mime_type = str(dados.get("mime_type") or conteudo.get("mimeType") or "").lower()
    extensao = nome.rsplit(".", 1)[-1].lower() if "." in nome else ""

    if mensagem_audio or mime_type.startswith("audio/") or extensao in {
        "mp3", "wav", "ogg", "m4a", "aac", "flac"
    }:
        tipo = "audio"
        rotulo = "Áudio"
    elif mime_type.startswith("image/") or extensao in {
        "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff", "heic", "avif"
    }:
        tipo = "imagem"
        rotulo = "Imagem"
    elif mime_type.startswith("video/") or extensao in {
        "mp4", "webm", "mov", "avi", "mkv", "m4v", "flv"
    }:
        tipo = "video"
        rotulo = "Vídeo"
    else:
        tipo = "ficheiro"
        rotulo = "Ficheiro"

    nome = re.sub(r"[\r\n]+", " ", nome)
    previa = f"{rotulo}: {nome}" if nome else rotulo
    return previa[:160], tipo


def enviar_notificacao_pushy(
    usuario_id,
    titulo,
    mensagem,
    dados=None,
    sala_ativa=None,
    enviar_para_online=False
):
    from routes.websoket_conectUser import usuarios_online, usuario_esta_na_sala

    if str(usuario_id) in usuarios_online:
        if sala_ativa and usuario_esta_na_sala(usuario_id, sala_ativa):
            return False
        if not sala_ativa and not enviar_para_online:
            return False

    usuario = db.session.get(Usuario, usuario_id)
    if not usuario:
        logger.warning("Pushy: utilizador destinatário não encontrado.")
        return False
    if not usuario.id_app_usuario_pushy:
        logger.warning("Pushy: destinatário sem token de dispositivo registado.")
        return False

    api_key = (os.getenv("PUSHY_API_KEY") or "").strip()
    if not api_key:
        logger.error("Pushy não configurado: defina PUSHY_API_KEY no ambiente do backend.")
        return False

    mensagem, tipo_anexo = _formatar_previa_mensagem(mensagem, dados)
    icon_url = (
        f"{FRONTEND_PUBLIC_URL.rstrip('/')}/pushy-icons/"
        f"{PUSHY_ATTACHMENT_ICONS[tipo_anexo]}"
        if tipo_anexo
        else _resolver_icone_pushy(dados)
    )
    dados_notificacao = {**(dados or {})}
    if tipo_anexo:
        dados_notificacao["attachment_type"] = tipo_anexo

    tipo_chamada = str(
        dados_notificacao.get("type")
        or dados_notificacao.get("notification_type")
        or ""
    ).lower()
    eh_chamada = tipo_chamada in {"voice_call", "chamada_voz"}
    som_notificacao = "default" if eh_chamada else None
    if som_notificacao:
        dados_notificacao["sound"] = som_notificacao

    conteudo = {
        "to": usuario.id_app_usuario_pushy,
        "data": {
            **dados_notificacao,
            "title": titulo,
            "message": mensagem,
            "sound": som_notificacao or "default",
        },
        "notification": {
            "title": titulo,
            "body": mensagem,
            "icon": icon_url,
            **({"sound": som_notificacao} if som_notificacao else {}),
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
