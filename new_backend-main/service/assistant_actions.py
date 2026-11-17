from datetime import datetime
from html import unescape
import json
import os
import random
import re
import uuid
from urllib.parse import urlparse

import cloudinary
import requests
from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.database import (
    Adicionar_dados_estado,
    Amigo,
    Amizade,
    AssistantActionExecution,
    CRMRegistro,
    Menssagens,
    Registrar_produto,
    SocialComment,
    SocialLike,
    SocialPost,
    Turma_Aula,
    Usuario,
    db,
)
from routes.api_crm import _serialize, _validate_advertisement, _validate_data
from service.friend_access import users_are_unblocked_friends


ACTION_TOKEN_MAX_AGE = 600
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"
GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
STATIC_CHAT_THEMES = {
    "original": "Original",
    "aurora": "Aurora",
    "doodle": "Doodle",
    "estrelas": "Estrelas",
    "malha-suave": "Malha suave",
    "blueprint": "Blueprint",
    "por-do-sol": "Pôr do sol",
    "papel": "Papel",
    "ondas": "Ondas",
    "grelha-neon": "Grelha neon",
    "diagonais": "Diagonais",
}
ANIMATED_CHAT_THEMES = {
    "warp": "Warp",
    "matrix": "Matrix",
    "vagalumes": "Vagalumes",
    "rede": "Rede",
    "oceano": "Oceano",
    "tempestade": "Tempestade",
    "aurora": "Aurora",
    "lava": "Lava",
    "neve": "Neve",
    "fogo-de-artificio": "Fogo de artifício",
}
ACTION_LABELS = {
    "produto": "produto",
    "publicacao": "publicação",
    "estado": "estado",
    "projecto": "projecto",
    "relatorio": "relatório",
    "turma": "turma",
    "anuncio": "anúncio",
    "mensagem": "mensagem",
    "pedido_amizade": "pedido de amizade",
    "comentario": "comentário",
    "curtida": "reação",
}


def _function_tool(name, description, properties, required):
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
                "additionalProperties": False,
            },
        },
    }


ASSISTANT_ACTION_TOOLS = [
    _function_tool(
        "create_product",
        "Preparar um produto para registo. O nome deve ter no máximo 65 caracteres. Não inventes dados em falta; pergunta primeiro. Pesquisa uma imagem no Openverse/Commons; se não houver resultado, usa a pesquisa web para encontrar um URL HTTPS direto e mostra a origem. Não marques uma licença web como verificada; pede confirmação de autorização comercial.",
        {
            "nome_produto": {"type": "string", "maxLength": 65},
            "descricao_produto": {"type": "string"},
            "tipo_produto": {"type": "string"},
            "preco_produto": {"type": "string"},
            "image_query": {"type": "string"},
        },
        ["nome_produto", "descricao_produto", "tipo_produto", "preco_produto", "image_query"],
    ),
    _function_tool(
        "create_publication",
        "Preparar uma publicação social. Usa image_query apenas se o utilizador pedir ou se a publicação precisar de imagem; pesquisa no Openverse/Commons e, sem resultados, procura uma imagem pública na web. Mostra a origem e não inventes licença nem factos pessoais.",
        {
            "texto": {"type": "string"},
            "localizacao": {"type": "string"},
            "image_query": {"type": "string"},
        },
        [],
    ),
    _function_tool(
        "create_story",
        "Preparar um estado para o chat principal da Âncora. Usa image_query apenas se pedirem ou se for necessário; pesquisa no Openverse/Commons e, sem resultados, procura uma imagem pública na web. Mostra a origem e não inventes licença nem dados pessoais.",
        {
            "texto": {"type": "string"},
            "image_query": {"type": "string"},
        },
        [],
    ),
    _function_tool(
        "create_project",
        "Preparar um projecto no CRM. Pergunta antes por qualquer campo que o utilizador não tenha informado; não inventes cliente, orçamento, prazo ou progresso.",
        {
            "nome": {"type": "string"},
            "cliente": {"type": "string"},
            "estado": {"type": "string", "enum": ["Planeado", "Em curso", "Pausado", "Concluído"]},
            "orcamento": {"type": "number"},
            "prazo": {"type": "string", "description": "Data no formato AAAA-MM-DD"},
            "progresso": {"type": "number"},
        },
        ["nome", "cliente", "estado", "orcamento", "prazo", "progresso"],
    ),
    _function_tool(
        "create_report",
        "Preparar um relatório textual no CRM. Não afirmes que consultaste métricas ou dados que não foram fornecidos pelo utilizador.",
        {
            "titulo": {"type": "string"},
            "tipo": {"type": "string"},
            "periodo": {"type": "string"},
            "conteudo": {"type": "string"},
        },
        ["titulo", "tipo", "periodo", "conteudo"],
    ),
    _function_tool(
        "create_class",
        "Preparar uma turma no CRM. Pergunta pelos dados em falta; não inventes formador, horário ou data de início.",
        {
            "nome": {"type": "string"},
            "formador": {"type": "string"},
            "alunos": {"type": "number"},
            "horario": {"type": "string"},
            "inicio": {"type": "string", "description": "Data no formato AAAA-MM-DD"},
            "estado": {"type": "string", "enum": ["Planeada", "Em curso", "Concluída"]},
        },
        ["nome", "formador", "alunos", "horario", "inicio", "estado"],
    ),
    _function_tool(
        "create_advertisement",
        "Preparar um anúncio do CRM para um produto ou curso já pertencente ao utilizador. Não activa tráfego pago nem gasta dinheiro.",
        {
            "origem_tipo": {"type": "string", "enum": ["produto", "curso"]},
            "produto_ou_curso": {"type": "string"},
            "preco": {"type": "string"},
            "badge": {"type": "string"},
            "descCurta": {"type": "string"},
            "descLonga": {"type": "string"},
            "beneficios": {"type": "string"},
            "proprietario": {"type": "string"},
            "whatsapp": {"type": "string"},
        },
        ["origem_tipo", "produto_ou_curso", "descCurta", "descLonga", "beneficios"],
    ),
    _function_tool(
        "change_theme",
        "Preparar uma alteração de tema para pré-visualização e confirmação. Para global usa scope global e theme_id light/dark; para paleta estática usa chat_static; para animação usa chat_animated.",
        {
            "scope": {"type": "string", "enum": ["global", "chat_static", "chat_animated"]},
            "theme_id": {"type": "string"},
        },
        ["scope", "theme_id"],
    ),
    _function_tool(
        "navigate_ancora",
        "Preparar a navegação para uma aba da Âncora. A mudança só ocorre depois da confirmação do utilizador.",
        {"destination": {"type": "string", "enum": ["mensagens", "loja", "crm", "painel", "perfil", "social", "academia"]}},
        ["destination"],
    ),
    _function_tool(
        "search_ancora",
        "Pesquisar conteúdo que o utilizador tem autorização para ver. A pesquisa é apenas de leitura; não pesquisar pagamentos, carteira, senhas ou dados privados de outros utilizadores.",
        {
            "scope": {"type": "string", "enum": ["produtos", "publicacoes", "crm", "turmas", "mensagens", "contactos"]},
            "query": {"type": "string"},
        },
        ["scope", "query"],
    ),
    _function_tool(
        "send_private_message",
        "Preparar o envio de uma mensagem de texto para um contacto que já está na lista de amigos do utilizador. A mensagem só será enviada depois de ele confirmar a pré-visualização.",
        {"recipient": {"type": "string"}, "text": {"type": "string"}},
        ["recipient", "text"],
    ),
    _function_tool(
        "send_friend_request",
        "Preparar um pedido de amizade para uma conta encontrada pelo nome exato ou telefone. O pedido só será enviado depois da confirmação do utilizador.",
        {"recipient": {"type": "string"}},
        ["recipient"],
    ),
    _function_tool(
        "add_social_comment",
        "Preparar um comentário numa publicação pública do Social. Mostra o texto para confirmação antes de o publicar.",
        {"post_id": {"type": "integer"}, "text": {"type": "string"}},
        ["post_id", "text"],
    ),
    _function_tool(
        "set_social_like",
        "Preparar para gostar ou retirar o gosto de uma publicação pública. A mudança exige confirmação.",
        {"post_id": {"type": "integer"}, "liked": {"type": "boolean"}},
        ["post_id", "liked"],
    ),
]


class AssistantActionError(ValueError):
    pass


class AssistantImageSearchError(RuntimeError):
    pass


def _serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"],
        salt="ancora-assistant-action-v1",
    )


def _uploaded_image_serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"],
        salt="ancora-assistant-uploaded-image-v1",
    )


def _validated_action_preview_payload(user_id, token):
    if not isinstance(token, str) or not token or len(token) > 16000:
        raise AssistantActionError("A pré-visualização da ação não é válida.")
    try:
        payload = _serializer().loads(token, max_age=ACTION_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired) as error:
        raise AssistantActionError("A pré-visualização expirou. Prepara a ação novamente.") from error
    action_id = payload.get("action_id") if isinstance(payload, dict) else None
    if (
        not isinstance(payload, dict) or payload.get("user_id") != user_id
        or not isinstance(action_id, str) or not re.fullmatch(r"[a-f0-9]{32}", action_id)
    ):
        raise AssistantActionError("A pré-visualização não pertence à sessão autenticada.")
    return action_id


def validate_assistant_action_preview(user_id, token):
    return _validated_action_preview_payload(user_id, token)


def _validated_uploaded_image_payload(user_id, token):
    if not isinstance(token, str) or not token or len(token) > 4000:
        raise AssistantActionError("A seleção da imagem não é válida.")
    try:
        payload = _uploaded_image_serializer().loads(token, max_age=ACTION_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired) as error:
        raise AssistantActionError("A seleção da imagem expirou.") from error
    if not isinstance(payload, dict) or payload.get("user_id") != user_id:
        raise AssistantActionError("A imagem selecionada não pertence à sessão autenticada.")
    image_url = payload.get("url")
    public_id = payload.get("public_id")
    action_id = payload.get("action_id")
    parsed = urlparse(image_url) if isinstance(image_url, str) else None
    cloud_name = cloudinary.config().cloud_name or os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    if (
        not parsed or parsed.scheme != "https" or parsed.hostname != "res.cloudinary.com"
        or not cloud_name
        or not re.match(rf"^/{re.escape(cloud_name)}/image/upload/(?:v\d+/)?ancora/assistant/", parsed.path)
        or parsed.query or parsed.fragment
        or not isinstance(public_id, str) or not public_id.startswith("ancora/assistant/")
        or len(public_id) > 255
        or not isinstance(action_id, str) or not re.fullmatch(r"[a-f0-9]{32}", action_id)
    ):
        raise AssistantActionError("A imagem selecionada não é válida.")
    return payload


def create_uploaded_image_token(user_id, image_url, filename, public_id, action_token):
    action_id = _validated_action_preview_payload(user_id, action_token)
    parsed = urlparse(image_url) if isinstance(image_url, str) else None
    cloud_name = cloudinary.config().cloud_name or os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    if (
        not parsed or parsed.scheme != "https" or parsed.hostname != "res.cloudinary.com"
        or not isinstance(public_id, str) or not public_id.startswith("ancora/assistant/")
        or len(public_id) > 255
    ):
        raise AssistantActionError("O endereço da imagem enviada não é válido.")
    if (
        not cloud_name
        or not re.match(rf"^/{re.escape(cloud_name)}/image/upload/(?:v\d+/)?ancora/assistant/", parsed.path)
        or parsed.query or parsed.fragment
    ):
        raise AssistantActionError("A imagem enviada não pertence ao armazenamento da Âncora.")
    return _uploaded_image_serializer().dumps({
        "user_id": user_id,
        "url": image_url,
        "public_id": public_id,
        "action_id": action_id,
        "filename": _normalise_text(filename)[:180] or "Imagem enviada",
    })


def _normalise_text(value):
    return re.sub(r"\s+", " ", value).strip()


def _string_value(args, field, label, maximum, optional=False):
    value = args.get(field)
    if optional and value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError(f"O campo {label} é obrigatório.")
    value = value.strip()
    if not value and optional:
        return ""
    if not value or len(value) > maximum:
        raise ValueError(f"O campo {label} deve ter entre 1 e {maximum} caracteres.")
    return value


def _commons_text(value):
    return _normalise_text(re.sub(r"<[^>]*>", " ", unescape(str(value or ""))))


def _allowed_commons_license(license_name):
    normalized = license_name.casefold()
    if "public domain" in normalized or "cc0" in normalized:
        return True
    if re.search(r"\bcc by-(?:nc|nd)(?:-| )", normalized):
        return False
    return normalized.startswith(("cc by ", "cc by-sa "))


def _allowed_openverse_license(license_name):
    normalized = str(license_name or "").strip().casefold().replace("_", "-")
    return normalized in {"cc0", "pdm", "by", "by-sa"}


def _safe_image_candidate(candidate, provider):
    image_url = candidate.get("url")
    preview_url = candidate.get("thumbnail") or candidate.get("preview_url") or image_url
    source_url = candidate.get("foreign_landing_url") or candidate.get("source_url")
    parts = [urlparse(value) if isinstance(value, str) else None for value in (image_url, preview_url, source_url)]
    if any(not part or part.scheme != "https" or not part.hostname for part in parts):
        return None
    license_code = str(candidate.get("license") or "").strip()
    license_name = license_code
    if provider == "Openverse":
        license_labels = {
            "cc0": "CC0",
            "pdm": "Public Domain Mark",
            "by": "CC BY",
            "by-sa": "CC BY-SA",
        }
        label = license_labels.get(license_code.casefold(), license_code.upper())
        version = str(candidate.get("license_version") or "").strip()
        license_name = f"{label} {version}".strip()
    if provider == "Wikimedia Commons":
        if parts[0].hostname != "upload.wikimedia.org" or parts[2].hostname != "commons.wikimedia.org":
            return None
        if parts[1].hostname != "upload.wikimedia.org":
            return None
    licence_allows_commercial_use = (
        _allowed_openverse_license(license_code)
        if provider == "Openverse"
        else _allowed_commons_license(license_name)
    )
    return {
        "title": _commons_text(candidate.get("title", "Imagem"))[:180],
        "url": image_url,
        "preview_url": preview_url,
        "source_url": source_url,
        "creator": _commons_text(candidate.get("creator", "Autor não identificado"))[:200],
        "license": (license_name or "Sem licença informada")[:80],
        "license_allows_commercial_use": licence_allows_commercial_use,
        "provider": provider,
    }


def _select_diverse_images(candidates, limit=3):
    unique_candidates = []
    seen_urls = set()
    for candidate in candidates:
        image_url = candidate.get("url")
        if image_url and image_url not in seen_urls:
            seen_urls.add(image_url)
            unique_candidates.append(candidate)
    return random.SystemRandom().sample(
        unique_candidates,
        k=min(limit, len(unique_candidates)),
    )


def _search_web_image(query):
    api_key = os.getenv("SECRETY_KEY_IA_GROQ", "").strip()
    if not api_key:
        return []

    instructions = (
        "Pesquisa na internet uma imagem pública que represente exatamente o assunto. "
        "Devolve apenas um objeto JSON com title, image_url e source_url. image_url tem "
        "de ser um URL HTTPS direto para o ficheiro da imagem, não uma página HTML; "
        "source_url deve ser a página onde a imagem foi encontrada. Usa URLs observados "
        "nos resultados da pesquisa, nunca inventes nem transformes endereços. Se não "
        "encontrares um URL direto verificável, devolve {}."
    )
    try:
        response = requests.post(
            GROQ_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-oss-120b",
                "messages": [
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": f"Encontra uma imagem para: {query}"},
                ],
                "tools": [{"type": "browser_search"}],
                "tool_choice": "required",
                "temperature": 0.1,
                "max_completion_tokens": 300,
                "reasoning_effort": "low",
                "citation_options": "enabled",
            },
            timeout=(5, 25),
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as error:
        current_app.logger.info(
            "Pesquisa web de imagem indisponível (%s).",
            type(error).__name__,
        )
        return []

    choices = payload.get("choices") if isinstance(payload, dict) else None
    message = choices[0].get("message") if isinstance(choices, list) and choices else None
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, str):
        return []

    decoder = json.JSONDecoder()
    web_result = None
    for index, character in enumerate(content):
        if character != "{":
            continue
        try:
            web_result, _ = decoder.raw_decode(content[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(web_result, dict):
            break
        web_result = None
    if not isinstance(web_result, dict):
        return []

    candidate = _safe_image_candidate({
        "title": web_result.get("title", "Imagem encontrada na internet"),
        "url": web_result.get("image_url"),
        "preview_url": web_result.get("image_url"),
        "source_url": web_result.get("source_url") or web_result.get("image_url"),
        "creator": "Autor não verificado",
        "license": "Não verificada",
    }, "Pesquisa web")
    return [candidate] if candidate else []


def search_public_images(query):
    query = _string_value({"query": query}, "query", "pesquisa de imagem", 120)
    errors = []
    candidates = []
    try:
        response = requests.get(
            OPENVERSE_API_URL,
            params={"q": query, "page_size": 20, "filter_dead": "true"},
            headers={"User-Agent": "AncoraAssistant/1.0 (open image search)"},
            timeout=(3.05, 8),
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results", []) if isinstance(payload, dict) else []
        candidates = []
        for item in results if isinstance(results, list) else []:
            if not isinstance(item, dict):
                continue
            candidate = _safe_image_candidate({
                "title": item.get("title"),
                "url": item.get("url"),
                "thumbnail": item.get("thumbnail"),
                "foreign_landing_url": item.get("foreign_landing_url"),
                "creator": item.get("creator"),
                "license": item.get("license"),
                "license_version": item.get("license_version"),
            }, "Openverse")
            if candidate:
                candidates.append(candidate)
        if len(candidates) >= 3:
            return _select_diverse_images(candidates)
    except (requests.RequestException, ValueError) as error:
        errors.append(error)

    try:
        response = requests.get(
            WIKIMEDIA_API_URL,
            params={
                "action": "query", "generator": "search", "gsrsearch": f"filetype:bitmap {query}",
                "gsrnamespace": 6, "gsrlimit": 20, "prop": "imageinfo",
                "iiprop": "url|extmetadata", "iiurlwidth": 640, "format": "json", "formatversion": 2,
            },
            headers={"User-Agent": "AncoraAssistant/1.0 (Wikimedia Commons image selection)"},
            timeout=(3.05, 8),
        )
        response.raise_for_status()
        payload = response.json()
        query_data = payload.get("query", {}) if isinstance(payload, dict) else {}
        pages = query_data.get("pages", []) if isinstance(query_data, dict) else []
        commons_candidates = []
        for page in pages if isinstance(pages, list) else []:
            image_info = page.get("imageinfo") if isinstance(page, dict) else None
            image_info = image_info[0] if isinstance(image_info, list) and image_info else {}
            metadata = image_info.get("extmetadata", {})
            candidate = _safe_image_candidate({
                "title": page.get("title", ""),
                "url": image_info.get("url"),
                "preview_url": image_info.get("thumburl") or image_info.get("url"),
                "source_url": image_info.get("descriptionurl"),
                "creator": metadata.get("Artist", {}).get("value") if isinstance(metadata, dict) else "",
                "license": _commons_text(metadata.get("LicenseShortName", {}).get("value") if isinstance(metadata, dict) else ""),
            }, "Wikimedia Commons")
            if candidate:
                commons_candidates.append(candidate)
        candidates.extend(commons_candidates)
    except (requests.RequestException, ValueError) as error:
        errors.append(error)
    if candidates:
        return _select_diverse_images(candidates)

    web_candidates = _search_web_image(query)
    if web_candidates:
        return web_candidates
    if len(errors) == 2:
        raise AssistantImageSearchError("Não foi possível pesquisar imagens agora. Podes escolher uma imagem do teu dispositivo.") from errors[-1]
    return []


def _try_search_public_images(query):
    try:
        return search_public_images(query)
    except AssistantImageSearchError:
        current_app.logger.info("Pesquisa de imagem indisponível; será oferecido carregamento local.")
        return []


def _image_credit(image):
    if image.get("custom"):
        return ""
    provider = image.get("provider") or "Wikimedia Commons"
    return f"Imagem: {image['creator']}, {provider}, licença {image['license']}."


def _images_that_fit(images, text, maximum):
    return [
        image for image in images
        if len(f"{text}\n\n{_image_credit(image)}" if text else _image_credit(image)) <= maximum
    ]


def _build_advertisement(user_id, user, args):
    origin_type = args.get("origem_tipo")
    if not isinstance(origin_type, str) or origin_type not in {"produto", "curso"}:
        raise ValueError("Indica se o anúncio é para um produto ou curso.")
    query = _string_value(args, "produto_ou_curso", "produto ou curso", 255)
    normalised_query = query.casefold()

    if origin_type == "produto":
        records = Registrar_produto.query.filter_by(id_usuario=user_id).all()
        matches = [
            record for record in records
            if record.nome_produto.strip().casefold() == normalised_query
        ]
    else:
        records = Turma_Aula.query.filter_by(
            id_admin_Turma=user_id,
            tipo_usuario_Turma="admin",
        ).all()
        matches = [
            record for record in records
            if (record.nome_Turma or "").strip().casefold() == normalised_query
        ]

    if len(matches) != 1:
        choices = [
            record.nome_produto if origin_type == "produto" else record.nome_Turma
            for record in records[:10]
            if (record.nome_produto if origin_type == "produto" else record.nome_Turma)
        ]
        if choices:
            raise ValueError(
                f"Não encontrei um único {origin_type} com o nome “{query}”. "
                f"Escolhe um destes da tua conta: {', '.join(choices)}."
            )
        raise ValueError(f"Não há {origin_type}s registados na tua conta para anunciar.")

    origin = matches[0]
    incoming = {
        "origem_tipo": origin_type,
        "origem_id": origin.id,
        "badge": args.get("badge", "NOVO"),
        "descCurta": args.get("descCurta"),
        "descLonga": args.get("descLonga"),
        "beneficios": args.get("beneficios"),
        "proprietario": args.get("proprietario") or user.nome,
        "whatsapp": args.get("whatsapp") or user.telefone,
    }
    if origin_type == "curso":
        incoming["preco"] = args.get("preco")
    return _validate_advertisement(user_id, incoming)


def _action_summary(action_type, data, image=None):
    if action_type == "produto":
        return (
            f"Nome: {data['nome_produto']}\nCategoria: {data['tipo_produto']}\n"
            f"Preço: {data['preco_produto']}\nDescrição: {data['descricao_produto']}"
        )
    if action_type == "publicacao":
        return f"Texto: {data['texto']}\nLocalização: {data.get('localizacao') or 'Não indicada'}"
    if action_type == "estado":
        return f"Texto: {data.get('texto') or 'Estado com imagem'}"
    if action_type == "projecto":
        return "\n".join(f"{key}: {value}" for key, value in data.items())
    if action_type == "relatorio":
        return "\n".join(f"{key}: {value}" for key, value in data.items())
    if action_type == "turma":
        return "\n".join(f"{key}: {value}" for key, value in data.items())
    if action_type == "anuncio":
        return (
            f"Anúncio: {data['title']}\nCategoria: {data['categoria']}\n"
            f"Preço: {data['preco']}\nDescrição: {data['descCurta']}"
        )
    if action_type == "mensagem":
        return f"Para: {data['recipient_name']}\nMensagem: {data['text']}"
    if action_type == "pedido_amizade":
        return f"Enviar um pedido de amizade para: {data['recipient_name']}"
    if action_type == "comentario":
        return f"Publicação #{data['post_id']}: {data.get('post_text') or 'Publicação'}\nComentário: {data['text']}"
    if action_type == "curtida":
        return f"Publicação #{data['post_id']}: {data.get('post_text') or 'Publicação'}\nAção: {'Gostar' if data['liked'] else 'Retirar o gosto'}"
    return ""


def _pending_action(user_id, action_type, data, images=None, requires_image=False):
    action_id = uuid.uuid4().hex
    token_payload = {
        "action_id": action_id,
        "user_id": user_id,
        "action_type": action_type,
        "data": data,
        "images": images or [],
        "requires_image": requires_image,
    }
    token = _serializer().dumps(token_payload)
    label = ACTION_LABELS[action_type]
    summary = _action_summary(action_type, data, (images or [None])[0])
    return {
        "token": token,
        "action_type": action_type,
        "title": f"Confirmar {label}",
        "summary": summary,
        "images": images or [],
        "preview_image": data.get("img") if action_type == "anuncio" else None,
        "can_upload_image": action_type == "produto" or requires_image,
        "requires_image": requires_image,
    }


def _search_ancora(user_id, scope, query):
    query = _string_value({"query": query}, "query", "termo de pesquisa", 120)
    needle = query.casefold()
    matches = []
    if scope == "produtos":
        records = Registrar_produto.query.order_by(Registrar_produto.id.desc()).limit(300).all()
        for record in records:
            if (record.preferencia_usuario or "todos").strip().casefold() not in {"todos", "publico", "público"}:
                continue
            searchable = f"{record.nome_produto} {record.descricao_produto} {record.tipo_produto}".casefold()
            if needle in searchable:
                matches.append(f"Produto: {record.nome_produto} · Categoria: {record.tipo_produto} · Preço: {record.preco_produto}")
    elif scope == "publicacoes":
        records = SocialPost.query.order_by(SocialPost.id.desc()).limit(300).all()
        for record in records:
            if needle in (record.texto or "").casefold():
                matches.append(f"Publicação #{record.id}: {_normalise_text(record.texto)[:220]}")
    elif scope == "crm":
        records = CRMRegistro.query.filter_by(user_id=user_id).order_by(CRMRegistro.id.desc()).limit(300).all()
        for record in records:
            if record.recurso == "faturas":
                continue
            summary = _normalise_text(str(record.dados or {}))
            if needle in f"{record.recurso} {summary}".casefold():
                matches.append(f"CRM · {record.recurso}: {summary[:220]}")
    elif scope == "turmas":
        records = Turma_Aula.query.filter(
            or_(Turma_Aula.id_admin_Turma == user_id, Turma_Aula.id_aluno_Turma == str(user_id))
        ).order_by(Turma_Aula.id.desc()).limit(300).all()
        for record in records:
            if needle in (record.nome_Turma or "").casefold():
                matches.append(f"Turma: {record.nome_Turma or 'Sem nome'} · Sala: {record.sala_Turma or 'não indicada'}")
    elif scope == "contactos":
        contacts = Amigo.query.filter_by(id_usuario=user_id).limit(500).all()
        for contact in contacts:
            name = contact.dados_amigo.nome if contact.dados_amigo else ""
            if needle in (name or "").casefold():
                matches.append(f"Contacto: {name}")
    elif scope == "mensagens":
        friendships = Amigo.query.filter_by(id_usuario=user_id).all()
        rooms = {
            friendship.nossa_sala
            for friendship in friendships
            if friendship.nossa_sala
            and users_are_unblocked_friends(user_id, friendship.id_amigo)
        }
        if rooms:
            messages = Menssagens.query.filter(Menssagens.nossa_sala.in_(rooms)).order_by(Menssagens.id.desc()).limit(500).all()
            for message in messages:
                content = (message.menssagem or "").casefold()
                if needle in content:
                    matches.append(
                        f"Conversa com {message.nome_remitente}: {_normalise_text(message.menssagem)[:180]}"
                    )
    else:
        raise AssistantActionError("Essa área não está disponível para pesquisa pelo assistente.")
    if not matches:
        return f"Não encontrei resultados para “{query}” em {scope}."
    return "Resultados da pesquisa (máximo 5):\n" + "\n".join(f"{index + 1}. {item}" for index, item in enumerate(matches[:5]))


def prepare_assistant_action(user_id, tool_name, raw_arguments):
    if not isinstance(raw_arguments, dict):
        raise AssistantActionError("O assistente não conseguiu preparar os dados da ação.")
    user = db.session.get(Usuario, user_id)
    if user is None:
        raise AssistantActionError("A sessão do utilizador não está válida.")

    if tool_name == "search_ancora":
        scope = raw_arguments.get("scope")
        if scope not in {"produtos", "publicacoes", "crm", "turmas", "mensagens", "contactos"}:
            raise AssistantActionError("Indica uma área válida para pesquisar.")
        return {"reply": _search_ancora(user_id, scope, raw_arguments.get("query"))}

    if tool_name == "send_private_message":
        recipient_query = _string_value(raw_arguments, "recipient", "destinatário", 120)
        message_text = _string_value(raw_arguments, "text", "mensagem", 5000)
        contacts = Amigo.query.filter_by(id_usuario=user_id).all()
        candidates = []
        for friendship in contacts:
            contact = db.session.get(Usuario, friendship.id_amigo)
            if (
                contact
                and friendship.nossa_sala
                and users_are_unblocked_friends(user_id, friendship.id_amigo)
                and (contact.nome or "").strip().casefold() == recipient_query.casefold()
            ):
                candidates.append((friendship, contact))
        if len(candidates) != 1:
            names = sorted({contact.nome for _, contact in candidates if contact.nome})
            if names:
                return {"reply": f"Tenho mais de um contacto chamado “{recipient_query}”. Indica qual é o destinatário correto: {', '.join(names)}."}
            return {"reply": f"Não encontrei “{recipient_query}” na tua lista de contactos desbloqueados. Adiciona-o primeiro ou confirma o nome do contacto."}
        friendship, contact = candidates[0]
        data = {
            "recipient_id": contact.id,
            "recipient_name": contact.nome,
            "room": friendship.nossa_sala,
            "text": message_text,
        }
        preview = _pending_action(user_id, "mensagem", data)
        return {
            "reply": f"Preparei uma mensagem para {contact.nome}. Revê o texto e confirma antes do envio.",
            "pending_action": preview,
        }

    if tool_name == "send_friend_request":
        recipient_query = _string_value(raw_arguments, "recipient", "nome ou telefone do utilizador", 120)
        recipient = Usuario.query.filter_by(telefone=recipient_query).first()
        digits = re.sub(r"\D", "", recipient_query)
        if recipient is None and digits:
            recipient = Usuario.query.filter_by(telefone=digits).first()
        if recipient is None:
            named_matches = Usuario.query.filter(
                db.func.lower(Usuario.nome) == recipient_query.casefold()
            ).limit(3).all()
            if len(named_matches) == 1:
                recipient = named_matches[0]
            elif len(named_matches) > 1:
                return {"reply": "Encontrei várias contas com esse nome. Indica o número de telefone exato do contacto."}
        if recipient is None:
            return {"reply": f"Não encontrei uma conta com o nome ou telefone “{recipient_query}”. Confirma os dados e tenta novamente."}
        if recipient.id == user_id:
            return {"reply": "Não podes enviar um pedido de amizade para a tua própria conta."}
        existing_friend = Amigo.query.filter(
            or_(
                (Amigo.id_usuario == user_id) & (Amigo.id_amigo == recipient.id),
                (Amigo.id_usuario == recipient.id) & (Amigo.id_amigo == user_id),
            )
        ).first()
        if existing_friend:
            return {"reply": f"Tu e {recipient.nome} já estão ligados como contactos."}
        existing_request = Amizade.query.filter(
            or_(
                (Amizade.remetente_id == user_id) & (Amizade.destinatario_id == recipient.id),
                (Amizade.remetente_id == recipient.id) & (Amizade.destinatario_id == user_id),
            ),
            Amizade.tipo_notificacao == "pedido_amizade",
            Amizade.status == "pendente",
        ).first()
        if existing_request:
            return {"reply": "Já existe um pedido de amizade pendente entre estas contas."}
        preview = _pending_action(user_id, "pedido_amizade", {
            "recipient_id": recipient.id,
            "recipient_name": recipient.nome,
        })
        return {
            "reply": f"Preparei um pedido de amizade para {recipient.nome}. Confirma abaixo para enviar.",
            "pending_action": preview,
        }

    if tool_name in {"add_social_comment", "set_social_like"}:
        post_id = raw_arguments.get("post_id")
        if isinstance(post_id, bool) or not isinstance(post_id, int) or post_id <= 0:
            raise AssistantActionError("Indica uma publicação válida do Social.")
        post = db.session.get(SocialPost, post_id)
        if post is None:
            return {"reply": "Não encontrei essa publicação. Pesquisa novamente e tenta outra vez."}
        if tool_name == "add_social_comment":
            text = _string_value(raw_arguments, "text", "comentário", 1000)
            action_type = "comentario"
            data = {"post_id": post_id, "post_text": _normalise_text(post.texto)[:180], "text": text}
        else:
            liked = raw_arguments.get("liked")
            if not isinstance(liked, bool):
                raise AssistantActionError("Indica se queres gostar ou retirar o gosto da publicação.")
            current_like = SocialLike.query.filter_by(post_id=post_id, user_id=user_id).first()
            if bool(current_like) == liked:
                return {"reply": "A publicação já está no estado de gosto que pediste."}
            action_type = "curtida"
            data = {
                "post_id": post_id,
                "post_text": _normalise_text(post.texto)[:180],
                "liked": liked,
                "was_liked": bool(current_like),
            }
        preview = _pending_action(user_id, action_type, data)
        return {
            "reply": "Preparei a ação no Social. Revê a publicação e confirma abaixo para continuar.",
            "pending_action": preview,
        }

    if tool_name == "navigate_ancora":
        tabs = {
            "mensagens": ("conteiner1", "Mensagens"), "loja": ("conteiner2", "Loja"),
            "crm": ("conteiner3", "CRM"), "painel": ("conteiner4", "Painel"),
            "perfil": ("conteiner5", "Perfil"), "social": ("conteiner8", "Social"),
            "academia": ("academy", "Academia"),
        }
        destination = raw_arguments.get("destination")
        if destination not in tabs:
            raise AssistantActionError("Não reconheci essa aba da Âncora.")
        tab_id, tab_name = tabs[destination]
        return {
            "reply": f"Preparei a navegação para {tab_name}. Confirma abaixo para mudar de aba.",
            "pending_action": {
                "title": f"Abrir {tab_name}",
                "summary": f"O assistente vai abrir a aba {tab_name}.",
                "images": [],
                "client_action": {"type": "navigate_tab", "destination": tab_id},
            },
        }

    if tool_name == "change_theme":
        scope = raw_arguments.get("scope")
        theme_id = raw_arguments.get("theme_id")
        if not isinstance(scope, str) or not isinstance(theme_id, str):
            raise AssistantActionError("Indica um tema disponível.")
        if scope == "global" and theme_id in {"light", "dark"}:
            theme_name = "claro" if theme_id == "light" else "escuro"
        elif scope == "chat_static" and theme_id in STATIC_CHAT_THEMES:
            theme_name = STATIC_CHAT_THEMES[theme_id]
        elif scope == "chat_animated" and theme_id in ANIMATED_CHAT_THEMES:
            theme_name = ANIMATED_CHAT_THEMES[theme_id]
        else:
            raise AssistantActionError("Não reconheci esse tema. Indica um tema claro/escuro ou uma paleta disponível.")
        return {
            "reply": f"Preparei o tema {theme_name}. Confirma abaixo para aplicar.",
            "pending_action": {
                "title": f"Aplicar tema {theme_name}",
                "summary": f"O tema será alterado para {theme_name}.",
                "images": [],
                "client_action": {"type": "change_theme", "scope": scope, "theme_id": theme_id},
            },
        }

    action_types = {
        "create_product": "produto",
        "create_publication": "publicacao",
        "create_story": "estado",
        "create_project": "projecto",
        "create_report": "relatorio",
        "create_class": "turma",
        "create_advertisement": "anuncio",
    }
    action_type = action_types.get(tool_name)
    if action_type is None:
        raise AssistantActionError("O assistente tentou executar uma operação não suportada.")

    required_fields = {
        "produto": {
            "nome_produto": "nome, descrição, categoria, preço e pesquisa para a imagem",
            "descricao_produto": "nome, descrição, categoria, preço e pesquisa para a imagem",
            "tipo_produto": "nome, descrição, categoria, preço e pesquisa para a imagem",
            "preco_produto": "nome, descrição, categoria, preço e pesquisa para a imagem",
            "image_query": "nome, descrição, categoria, preço e pesquisa para a imagem",
        },
        "projecto": {
            "nome": "nome, cliente, estado, orçamento, prazo e progresso",
            "cliente": "nome, cliente, estado, orçamento, prazo e progresso",
            "estado": "nome, cliente, estado, orçamento, prazo e progresso",
            "orcamento": "nome, cliente, estado, orçamento, prazo e progresso",
            "prazo": "nome, cliente, estado, orçamento, prazo e progresso",
            "progresso": "nome, cliente, estado, orçamento, prazo e progresso",
        },
        "relatorio": {
            "titulo": "título, tipo, período e conteúdo do relatório",
            "tipo": "título, tipo, período e conteúdo do relatório",
            "periodo": "título, tipo, período e conteúdo do relatório",
            "conteudo": "título, tipo, período e conteúdo do relatório",
        },
        "turma": {
            "nome": "nome, formador, número de alunos, horário, data de início e estado",
            "formador": "nome, formador, número de alunos, horário, data de início e estado",
            "alunos": "nome, formador, número de alunos, horário, data de início e estado",
            "horario": "nome, formador, número de alunos, horário, data de início e estado",
            "inicio": "nome, formador, número de alunos, horário, data de início e estado",
            "estado": "nome, formador, número de alunos, horário, data de início e estado",
        },
    }
    required = required_fields.get(action_type, {})
    missing = [field for field in required if raw_arguments.get(field) is None or raw_arguments.get(field) == ""]
    if action_type in {"publicacao", "estado"}:
        if not raw_arguments.get("texto") and not raw_arguments.get("image_query"):
            missing = ["texto ou pedido de imagem"]
    if action_type == "anuncio":
        missing_labels = [
            label for field, label in (
                ("produto_ou_curso", "produto ou curso registado"),
                ("descCurta", "descrição curta"),
                ("descLonga", "descrição completa"),
                ("beneficios", "benefícios"),
            )
            if not raw_arguments.get(field)
        ]
        if missing_labels:
            return {
                "reply": f"Para preparar o anúncio, preciso de indicar: {', '.join(missing_labels)}."
            }
    elif action_type in {"publicacao", "estado"} and missing:
        return {"reply": "Escreve o texto da publicação/estado ou pede uma imagem para acompanhar."}
    elif missing:
        return {
            "reply": (
                "Para preparar o registo, preciso de: "
                f"{next(iter(required.values()), 'os dados obrigatórios')}."
            )
        }

    requires_image = False
    try:
        images = []
        if action_type == "produto":
            data = {
                "nome_produto": _string_value(raw_arguments, "nome_produto", "nome do produto", 65),
                "descricao_produto": _string_value(raw_arguments, "descricao_produto", "descrição do produto", 4000),
                "tipo_produto": _string_value(raw_arguments, "tipo_produto", "categoria", 255),
                "preco_produto": _string_value(raw_arguments, "preco_produto", "preço", 100),
                "image_query": _string_value(raw_arguments, "image_query", "pesquisa da imagem", 120),
            }
            images = _try_search_public_images(data.pop("image_query"))
            requires_image = True
        elif action_type == "publicacao":
            data = {
                "texto": _string_value(
                    raw_arguments, "texto", "texto da publicação", 3000, optional=True
                ),
                "localizacao": _string_value(
                    raw_arguments, "localizacao", "localização", 120, optional=True
                ),
            }
            image_query = raw_arguments.get("image_query")
            requires_image = bool(image_query)
            if image_query:
                images = _try_search_public_images(
                    _string_value({"query": image_query}, "query", "pesquisa da imagem", 120)
                )
                images = _images_that_fit(images, data["texto"], 3000)
            if not data["texto"] and not images and not requires_image:
                return {"reply": "Escreve o texto da publicação ou pede uma imagem para a acompanhar."}
        elif action_type == "estado":
            text = _string_value(raw_arguments, "texto", "texto do estado", 500, optional=True)
            image_query = raw_arguments.get("image_query")
            requires_image = bool(image_query)
            if image_query:
                images = _try_search_public_images(
                    _string_value({"query": image_query}, "query", "pesquisa da imagem", 120)
                )
                images = _images_that_fit(images, text, 500)
            if not text and not images and not requires_image:
                return {"reply": "Escreve o texto do estado ou pede uma imagem para o acompanhar."}
            data = {"texto": text}
        elif action_type in {"projecto", "relatorio", "turma"}:
            resource = {
                "projecto": "projectos",
                "relatorio": "relatorios",
                "turma": "turmas",
            }[action_type]
            data = _validate_data(resource, raw_arguments)
        else:
            data = _build_advertisement(user_id, user, raw_arguments)
    except ValueError as error:
        return {"reply": str(error)}
    except AssistantImageSearchError:
        raise

    preview = _pending_action(user_id, action_type, data, images, requires_image)
    return {
        "reply": f"Preparei o {ACTION_LABELS[action_type]}. Revê os dados e confirma abaixo para registar.",
        "pending_action": preview,
    }


def _append_image_credit(text, image, maximum):
    if image.get("custom"):
        if len(text) > maximum:
            raise AssistantActionError("O texto excede o tamanho permitido.")
        return text
    credit = _image_credit(image)
    result = f"{text}\n\n{credit}" if text else credit
    if len(result) > maximum:
        raise AssistantActionError(
            "O texto está demasiado longo para incluir a atribuição obrigatória da imagem. Encurta-o e tenta novamente."
        )
    return result


def _resolve_image(user_id, images, image_index, custom_image_token=None, expected_action_id=None):
    if custom_image_token is not None:
        if image_index is not None or not isinstance(custom_image_token, str) or len(custom_image_token) > 4000:
            raise AssistantActionError("A imagem selecionada não é válida.")
        payload = _validated_uploaded_image_payload(user_id, custom_image_token)
        if payload.get("action_id") != expected_action_id:
            raise AssistantActionError("A imagem está associada a outra ação do assistente.")
        image_url = payload["url"]
        return {
            "url": image_url,
            "preview_url": image_url,
            "source_url": "",
            "creator": "Imagem carregada pelo utilizador",
            "license": "Imagem do dispositivo",
            "provider": "Dispositivo",
            "custom": True,
        }
    if not images:
        if image_index is not None:
            raise AssistantActionError("A ação não tem uma imagem para selecionar.")
        return None
    if isinstance(image_index, bool) or not isinstance(image_index, int):
        raise AssistantActionError("Seleciona uma imagem antes de confirmar.")
    if image_index < 0 or image_index >= len(images):
        raise AssistantActionError("A imagem selecionada não é válida.")
    return images[image_index]


def _execute_record(user_id, action_type, data, image):
    if action_type == "comentario":
        post = db.session.get(SocialPost, data.get("post_id"))
        if post is None:
            raise AssistantActionError("A publicação já não existe. Pesquisa novamente.")
        comment = SocialComment(post_id=post.id, user_id=user_id, texto=data["text"])
        db.session.add(comment)
        db.session.flush()
        return {"resource": "comentario", "id": comment.id, "title": "Comentário"}
    if action_type == "curtida":
        post = db.session.get(SocialPost, data.get("post_id"))
        if post is None:
            raise AssistantActionError("A publicação já não existe. Pesquisa novamente.")
        current_like = SocialLike.query.filter_by(post_id=post.id, user_id=user_id).first()
        if bool(current_like) != data.get("was_liked"):
            raise AssistantActionError("O gosto desta publicação mudou. Prepara a ação novamente.")
        if data["liked"]:
            db.session.add(SocialLike(post_id=post.id, user_id=user_id))
        elif current_like:
            db.session.delete(current_like)
        db.session.flush()
        return {"resource": "curtida", "id": post.id, "title": "Reação", "liked": data["liked"]}
    if action_type == "pedido_amizade":
        recipient_id = data.get("recipient_id")
        if not isinstance(recipient_id, int) or recipient_id == user_id:
            raise AssistantActionError("O destinatário deste pedido já não é válido.")
        recipient = db.session.get(Usuario, recipient_id)
        sender = db.session.get(Usuario, user_id)
        if not recipient or not sender:
            raise AssistantActionError("Não foi possível encontrar as contas envolvidas.")
        existing_friend = Amigo.query.filter(
            or_(
                (Amigo.id_usuario == user_id) & (Amigo.id_amigo == recipient_id),
                (Amigo.id_usuario == recipient_id) & (Amigo.id_amigo == user_id),
            )
        ).first()
        existing_request = Amizade.query.filter(
            or_(
                (Amizade.remetente_id == user_id) & (Amizade.destinatario_id == recipient_id),
                (Amizade.remetente_id == recipient_id) & (Amizade.destinatario_id == user_id),
            ),
            Amizade.tipo_notificacao == "pedido_amizade",
            Amizade.status == "pendente",
        ).first()
        if existing_friend or existing_request:
            raise AssistantActionError("A relação entre estas contas mudou. Prepara o pedido novamente.")
        friend_request = Amizade(
            remetente_id=user_id,
            destinatario_id=recipient_id,
            status="pendente",
            foto_usuario=sender.foto_usuario,
            tipo_notificacao="pedido_amizade",
        )
        db.session.add(friend_request)
        db.session.flush()
        return {
            "resource": "pedido_amizade",
            "id": friend_request.id,
            "recipient_id": recipient.id,
            "recipient_name": recipient.nome,
            "sender_name": sender.nome,
            "sender_id": user_id,
        }
    if action_type == "mensagem":
        friendship = Amigo.query.filter_by(
            id_usuario=user_id,
            id_amigo=data.get("recipient_id"),
            nossa_sala=data.get("room"),
        ).first()
        if not friendship or not users_are_unblocked_friends(user_id, data.get("recipient_id")):
            raise AssistantActionError("Este contacto já não está disponível para mensagens. Prepara a ação novamente.")
        sender = db.session.get(Usuario, user_id)
        recipient = db.session.get(Usuario, data["recipient_id"])
        if not sender or not recipient:
            raise AssistantActionError("Não foi possível encontrar os participantes da conversa.")
        message = Menssagens(
            nossa_sala=data["room"],
            menssagem=data["text"],
            id_remitente=sender.id,
            nome_remitente=sender.nome,
            id_destinatario=recipient.id,
            nome_destinatario=recipient.nome,
            data_envio=datetime.now().strftime("%H:%M"),
            lida=False,
            tipo="texto",
        )
        db.session.add(message)
        db.session.flush()
        return {
            "resource": "mensagem",
            "id": message.id,
            "title": f"Mensagem para {recipient.nome}",
            "room": data["room"],
            "recipient_id": recipient.id,
            "recipient_name": recipient.nome,
            "text": data["text"],
            "sender_name": sender.nome,
            "sender_photo": sender.foto_usuario,
        }
    if action_type == "produto":
        description = data["descricao_produto"]
        product = Registrar_produto(
            nome_produto=data["nome_produto"],
            descricao_produto=description,
            tipo_produto=data["tipo_produto"],
            preco_produto=data["preco_produto"],
            url_imagem_produto=image["url"],
            image_source_url=None if image.get("custom") else image.get("source_url"),
            image_creator=None if image.get("custom") else image.get("creator"),
            image_license=None if image.get("custom") else image.get("license"),
            nome_vendedor=db.session.get(Usuario, user_id).nome,
            id_usuario=user_id,
        )
        db.session.add(product)
        db.session.flush()
        return {
            "resource": "produto",
            "id": product.id,
            "title": product.nome_produto,
        }
    if action_type == "publicacao":
        text = data["texto"]
        if image:
            text = _append_image_credit(text, image, 3000)
        post = SocialPost(
            user_id=user_id,
            texto=text,
            media_url=image["url"] if image else None,
            media_type="image" if image else None,
        )
        db.session.add(post)
        db.session.flush()
        return {"resource": "publicacao", "id": post.id, "title": "Publicação"}
    if action_type == "estado":
        text = data["texto"]
        state_type = "imagem" if image else "texto"
        state_data = image["url"] if image else text
        description = _append_image_credit(text, image, 500) if image else "none"
        user = db.session.get(Usuario, user_id)
        state = Adicionar_dados_estado(
            id_usuario=user_id,
            dados_estado=state_data,
            descricao_dados=description,
            tipo_estado=state_type,
            nome_usuario_estado=user.nome,
            foto_usuario_estado=user.foto_usuario,
        )
        db.session.add(state)
        db.session.flush()
        return {"resource": "estado", "id": state.id, "title": "Estado"}

    resource_by_type = {
        "projecto": "projectos",
        "relatorio": "relatorios",
        "turma": "turmas",
        "anuncio": "anuncios",
    }
    resource = resource_by_type.get(action_type)
    if not resource:
        raise AssistantActionError("A operação solicitada não é suportada.")
    if action_type == "anuncio":
        user = db.session.get(Usuario, user_id)
        incoming = {
            "origem_tipo": data["origem_tipo"],
            "origem_id": data["origem_id"],
            "badge": data["badge"],
            "descCurta": data["descCurta"],
            "descLonga": data["descLonga"],
            "beneficios": data["beneficios"],
            "proprietario": data["proprietario"],
            "whatsapp": data["whatsapp"],
        }
        if data["origem_tipo"] == "curso":
            incoming["preco"] = data["preco"]
        try:
            current_ad = _validate_advertisement(user_id, incoming)
        except ValueError as error:
            raise AssistantActionError(str(error)) from error
        if any(
            current_ad[field] != data[field]
            for field in ("title", "categoria", "preco", "img")
        ):
            raise AssistantActionError(
                "O produto ou curso mudou depois da pré-visualização. Prepara o anúncio novamente."
            )
        data = current_ad
    record = CRMRegistro(user_id=user_id, recurso=resource, dados=data)
    db.session.add(record)
    db.session.flush()
    return {
        "resource": resource,
        **_serialize(record),
        "title": data.get("title") or data.get("nome") or data.get("titulo") or data.get("numero"),
    }


def execute_assistant_action(
    user_id,
    token,
    image_index=None,
    custom_image_token=None,
    rights_confirmed=False,
):
    if not isinstance(token, str) or not token or len(token) > 16000:
        raise AssistantActionError("A confirmação da ação é inválida.")
    try:
        payload = _serializer().loads(token, max_age=ACTION_TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired) as error:
        raise AssistantActionError("A confirmação expirou ou não é válida. Pede novamente ao assistente.") from error
    if not isinstance(payload, dict) or payload.get("user_id") != user_id:
        raise AssistantActionError("Esta ação não pertence à sessão autenticada.")

    action_id = payload.get("action_id")
    action_type = payload.get("action_type")
    data = payload.get("data")
    images = payload.get("images", [])
    if (
        not isinstance(action_id, str)
        or not re.fullmatch(r"[a-f0-9]{32}", action_id)
        or not isinstance(data, dict)
        or not isinstance(images, list)
    ):
        raise AssistantActionError("Os dados da confirmação estão incompletos.")

    existing = db.session.get(AssistantActionExecution, action_id)
    if existing is not None:
        if existing.user_id != user_id:
            raise AssistantActionError("Esta ação não pertence à sessão autenticada.")
        return existing.result, True

    image = _resolve_image(user_id, images, image_index, custom_image_token, action_id)
    if payload.get("requires_image") and image is None:
        raise AssistantActionError("Escolhe uma imagem da pesquisa ou envia uma imagem do teu dispositivo antes de confirmar.")
    image_needs_rights_confirmation = bool(
        image and (
            action_type == "produto"
            or image.get("custom")
            or not image.get("license_allows_commercial_use")
        )
    )
    if image_needs_rights_confirmation and rights_confirmed is not True:
        raise AssistantActionError(
            "Confirma que és titular ou tens autorização para utilizar a imagem escolhida."
        )
    try:
        result = _execute_record(user_id, action_type, data, image)
        db.session.add(AssistantActionExecution(
            action_id=action_id,
            user_id=user_id,
            result=result,
        ))
        db.session.commit()
        if action_type == "produto":
            try:
                from routes.websocket import socketio

                product = db.session.get(Registrar_produto, result["id"])
                if product:
                    socketio.emit("produto_registrado", {
                        "id": product.id,
                        "nome": product.nome_produto,
                        "descricao": product.descricao_produto,
                        "tipo": product.tipo_produto,
                        "preco": product.preco_produto,
                        "url_imagem_produto": product.url_imagem_produto,
                        "url_imagem_produto_blurhash": product.url_imagem_produto_blurhash,
                        "id_usuario": product.id_usuario,
                        "data_registro": str(product.data_registro),
                    }, namespace="/")
            except Exception:
                current_app.logger.exception(
                    "Produto do assistente criado, mas a notificação em tempo real falhou."
                )
        if action_type == "estado":
            from service.estado_realtime_service import notificar_amigos_novo_estado

            state = db.session.get(Adicionar_dados_estado, result["id"])
            if not notificar_amigos_novo_estado(state):
                result["warning"] = "O estado foi criado, mas não foi possível notificar os teus amigos."
                execution = db.session.get(AssistantActionExecution, action_id)
                execution.result = result
                try:
                    db.session.commit()
                except SQLAlchemyError:
                    db.session.rollback()
                    current_app.logger.exception(
                        "Não foi possível guardar o aviso de notificação do estado."
                    )
        if action_type == "mensagem":
            try:
                from routes.websocket import socketio
                from service.pushy_service import enviar_notificacao_pushy

                message = db.session.get(Menssagens, result["id"])
                unread_count = Menssagens.query.filter_by(
                    id_destinatario=result["recipient_id"],
                    nossa_sala=result["room"],
                    lida=False,
                ).count()
                socketio.emit("responsta_nova_quantidade_de_menssagem", {
                    "quantidade": unread_count,
                    "id_amigo": user_id,
                    "nossa_sala": result["room"],
                    "nova_menssagem": result["text"],
                    "horario_formatado": message.data_envio,
                    "ultima_menssagem_remitente_id": user_id,
                    "ultima_menssagem_lida": False,
                }, room=str(result["recipient_id"]))
                socketio.emit("receber_menssagem", {
                    "id": message.id,
                    "nossa_sala": result["room"],
                    "menssagem": result["text"],
                    "id_remitente": user_id,
                    "nome_remitente": result["sender_name"],
                    "id_destinatario": result["recipient_id"],
                    "nome_destinatario": result["recipient_name"],
                    "data_envio": message.data_envio,
                    "lida": False,
                    "tipo": "texto",
                    "foto_usuario": result["sender_photo"],
                }, room=result["room"])
                notification_text = result["text"][:157] + "..." if len(result["text"]) > 160 else result["text"]
                enviar_notificacao_pushy(
                    result["recipient_id"],
                    result["sender_name"],
                    notification_text,
                    {
                        "type": "new_message",
                        "sender_id": user_id,
                        "room": result["room"],
                        "foto_usuario": result["sender_photo"],
                        "foto_remitente": result["sender_photo"],
                    },
                    sala_ativa=result["room"],
                )
            except Exception:
                result["warning"] = "A mensagem foi enviada, mas não foi possível notificar o contacto."
                current_app.logger.exception("Falha ao notificar após mensagem do assistente.")
                execution = db.session.get(AssistantActionExecution, action_id)
                execution.result = result
                try:
                    db.session.commit()
                except SQLAlchemyError:
                    db.session.rollback()
                    current_app.logger.exception("Não foi possível guardar o aviso da mensagem do assistente.")
        if action_type == "pedido_amizade":
            try:
                from routes.websocket import socketio
                from service.pushy_service import enviar_notificacao_pushy

                socketio.emit("receber_notificacao", {
                    "id": result["id"],
                    "de_id": result["sender_id"],
                    "nome_remetente": result["sender_name"],
                    "mensagem": f"{result['sender_name']} quer ser teu amigo",
                    "tipo_notificacao": "pedido_amizade",
                    "foto_usuario": db.session.get(Usuario, user_id).foto_usuario,
                    "status": "pendente",
                }, room=str(result["recipient_id"]))
                enviar_notificacao_pushy(
                    result["recipient_id"],
                    "Novo pedido de amizade",
                    f"{result['sender_name']} quer ser teu amigo",
                    {
                        "type": "notification",
                        "notification_type": "pedido_amizade",
                        "sender_id": user_id,
                    },
                    enviar_para_online=True,
                )
            except Exception:
                result["warning"] = "O pedido foi enviado, mas não foi possível notificar o destinatário."
                current_app.logger.exception("Falha ao notificar após pedido de amizade do assistente.")
                execution = db.session.get(AssistantActionExecution, action_id)
                execution.result = result
                try:
                    db.session.commit()
                except SQLAlchemyError:
                    db.session.rollback()
                    current_app.logger.exception("Não foi possível guardar o aviso do pedido de amizade.")
        return result, False
    except AssistantActionError:
        db.session.rollback()
        raise
    except IntegrityError:
        db.session.rollback()
        existing = db.session.get(AssistantActionExecution, action_id)
        if existing is not None and existing.user_id == user_id:
            return existing.result, True
        current_app.logger.exception("Conflito ao confirmar uma ação do assistente.")
        raise AssistantActionError("Não foi possível confirmar a ação. Tenta novamente.") from None
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Falha ao guardar uma ação confirmada do assistente.")
        raise AssistantActionError("Não foi possível guardar o registo. Tenta novamente.") from None

