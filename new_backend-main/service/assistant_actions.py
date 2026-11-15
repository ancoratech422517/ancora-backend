from datetime import timedelta, timezone
from html import unescape
import re
import uuid
from urllib.parse import urlparse

import requests
from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from models.database import (
    Adicionar_dados_estado,
    AssistantActionExecution,
    CRMRegistro,
    Registrar_produto,
    SocialPost,
    Turma_Aula,
    Usuario,
    db,
)
from routes.api_crm import _serialize, _validate_advertisement, _validate_data


ACTION_TOKEN_MAX_AGE = 600
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
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
    "fatura": "fatura",
    "relatorio": "relatório",
    "turma": "turma",
    "anuncio": "anúncio",
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
        "Preparar um produto para registo. Não inventes dados em falta; pergunta primeiro. É obrigatório pesquisar uma imagem licenciada no Wikimedia Commons.",
        {
            "nome_produto": {"type": "string"},
            "descricao_produto": {"type": "string"},
            "tipo_produto": {"type": "string"},
            "preco_produto": {"type": "string"},
            "image_query": {"type": "string"},
        },
        ["nome_produto", "descricao_produto", "tipo_produto", "preco_produto", "image_query"],
    ),
    _function_tool(
        "create_publication",
        "Preparar uma publicação social. Usa image_query apenas se o utilizador pedir ou se a publicação precisar de imagem; não inventes factos pessoais.",
        {
            "texto": {"type": "string"},
            "localizacao": {"type": "string"},
            "image_query": {"type": "string"},
        },
        [],
    ),
    _function_tool(
        "create_story",
        "Preparar um estado para o chat principal da Âncora. Usa image_query apenas se pedirem ou se for necessário; não inventes dados pessoais.",
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
        "create_invoice",
        "Preparar uma fatura no CRM. Pergunta por todos os dados em falta; não inventes número, cliente, valores ou datas. A criação não regista pagamento.",
        {
            "numero": {"type": "string"},
            "cliente": {"type": "string"},
            "valor": {"type": "number"},
            "emissao": {"type": "string", "description": "Data no formato AAAA-MM-DD"},
            "vencimento": {"type": "string", "description": "Data no formato AAAA-MM-DD"},
            "estado": {"type": "string", "enum": ["Pendente", "Paga", "Atrasada"]},
        },
        ["numero", "cliente", "valor", "emissao", "vencimento", "estado"],
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
        "Alterar imediatamente o tema do utilizador. Para global usa scope global e theme_id light/dark; para paleta estática usa chat_static; para animação usa chat_animated. IDs estáticos: original, aurora, doodle, estrelas, malha-suave, blueprint, por-do-sol, papel, ondas, grelha-neon, diagonais. IDs animados: warp, matrix, vagalumes, rede, oceano, tempestade, aurora, lava, neve, fogo-de-artificio.",
        {
            "scope": {"type": "string", "enum": ["global", "chat_static", "chat_animated"]},
            "theme_id": {"type": "string"},
        },
        ["scope", "theme_id"],
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


def search_public_images(query):
    query = _string_value({"query": query}, "query", "pesquisa de imagem", 120)
    try:
        response = requests.get(
            WIKIMEDIA_API_URL,
            params={
                "action": "query",
                "generator": "search",
                "gsrsearch": f"filetype:bitmap {query}",
                "gsrnamespace": 6,
                "gsrlimit": 8,
                "prop": "imageinfo",
                "iiprop": "url|extmetadata",
                "iiurlwidth": 640,
                "format": "json",
                "formatversion": 2,
            },
            headers={"User-Agent": "AncoraAssistant/1.0 (Wikimedia Commons image selection)"},
            timeout=(3.05, 8),
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as error:
        raise AssistantImageSearchError(
            "Não foi possível pesquisar imagens licenciadas no Wikimedia Commons. Tenta novamente."
        ) from error

    if not isinstance(payload, dict):
        raise AssistantImageSearchError("O Wikimedia Commons devolveu uma resposta inválida.")
    query_data = payload.get("query", {})
    pages = query_data.get("pages", []) if isinstance(query_data, dict) else []
    if not isinstance(pages, list):
        raise AssistantImageSearchError("O Wikimedia Commons devolveu uma resposta inválida.")

    candidates = []
    for page in pages:
        image_info = page.get("imageinfo") if isinstance(page, dict) else None
        image_info = image_info[0] if isinstance(image_info, list) and image_info else {}
        metadata = image_info.get("extmetadata", {})
        license_name = _commons_text(
            metadata.get("LicenseShortName", {}).get("value")
            if isinstance(metadata, dict) else ""
        )
        image_url = image_info.get("url")
        source_url = image_info.get("descriptionurl")
        preview_url = image_info.get("thumburl") or image_url
        image_parts = urlparse(image_url) if isinstance(image_url, str) else None
        source_parts = urlparse(source_url) if isinstance(source_url, str) else None
        preview_parts = urlparse(preview_url) if isinstance(preview_url, str) else None
        if (
            not _allowed_commons_license(license_name)
            or not image_parts or image_parts.scheme != "https"
            or image_parts.hostname != "upload.wikimedia.org"
            or not source_parts or source_parts.scheme != "https"
            or source_parts.hostname != "commons.wikimedia.org"
            or not preview_parts or preview_parts.scheme != "https"
            or preview_parts.hostname != "upload.wikimedia.org"
        ):
            continue

        creator = _commons_text(
            metadata.get("Artist", {}).get("value")
            if isinstance(metadata, dict) else ""
        ) or "Autor não identificado"
        candidates.append({
            "title": _commons_text(page.get("title", "")),
            "url": image_url,
            "preview_url": preview_url,
            "source_url": source_url,
            "creator": creator[:200],
            "license": license_name[:80],
        })
        if len(candidates) == 3:
            break
    return candidates


def _image_credit(image):
    return (
        f"Imagem: {image['creator']}, Wikimedia Commons, licença {image['license']}. "
        f"Fonte: {image['source_url']}"
    )


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
    if action_type == "fatura":
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
    return ""


def _pending_action(user_id, action_type, data, images=None):
    action_id = uuid.uuid4().hex
    token_payload = {
        "action_id": action_id,
        "user_id": user_id,
        "action_type": action_type,
        "data": data,
        "images": images or [],
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
    }


def prepare_assistant_action(user_id, tool_name, raw_arguments):
    if not isinstance(raw_arguments, dict):
        raise AssistantActionError("O assistente não conseguiu preparar os dados da ação.")
    user = db.session.get(Usuario, user_id)
    if user is None:
        raise AssistantActionError("A sessão do utilizador não está válida.")

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
            "reply": f"Pronto, vou aplicar o tema {theme_name}.",
            "client_action": {
                "type": "change_theme",
                "scope": scope,
                "theme_id": theme_id,
            },
        }

    action_types = {
        "create_product": "produto",
        "create_publication": "publicacao",
        "create_story": "estado",
        "create_project": "projecto",
        "create_invoice": "fatura",
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
        "fatura": {
            "numero": "número, cliente, valor, data de emissão, vencimento e estado",
            "cliente": "número, cliente, valor, data de emissão, vencimento e estado",
            "valor": "número, cliente, valor, data de emissão, vencimento e estado",
            "emissao": "número, cliente, valor, data de emissão, vencimento e estado",
            "vencimento": "número, cliente, valor, data de emissão, vencimento e estado",
            "estado": "número, cliente, valor, data de emissão, vencimento e estado",
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

    try:
        images = []
        if action_type == "produto":
            data = {
                "nome_produto": _string_value(raw_arguments, "nome_produto", "nome do produto", 100),
                "descricao_produto": _string_value(raw_arguments, "descricao_produto", "descrição do produto", 4000),
                "tipo_produto": _string_value(raw_arguments, "tipo_produto", "categoria", 255),
                "preco_produto": _string_value(raw_arguments, "preco_produto", "preço", 100),
                "image_query": _string_value(raw_arguments, "image_query", "pesquisa da imagem", 120),
            }
            images = search_public_images(data.pop("image_query"))
            images = _images_that_fit(images, data["descricao_produto"], 6000)
            if not images:
                return {"reply": "Não encontrei uma imagem licenciada adequada ou a descrição está demasiado longa para incluir o crédito. Tenta outra pesquisa ou encurta a descrição."}
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
            if image_query:
                images = search_public_images(
                    _string_value({"query": image_query}, "query", "pesquisa da imagem", 120)
                )
                images = _images_that_fit(images, data["texto"], 3000)
                if not images:
                    return {"reply": "Não encontrei uma imagem licenciada adequada ou o texto está demasiado longo para incluir o crédito. Tenta outra pesquisa ou encurta o texto."}
            if not data["texto"] and not images:
                return {"reply": "Escreve o texto da publicação ou pede uma imagem para a acompanhar."}
        elif action_type == "estado":
            text = _string_value(raw_arguments, "texto", "texto do estado", 500, optional=True)
            image_query = raw_arguments.get("image_query")
            if image_query:
                images = search_public_images(
                    _string_value({"query": image_query}, "query", "pesquisa da imagem", 120)
                )
                images = _images_that_fit(images, text, 500)
                if not images:
                    return {"reply": "Não encontrei uma imagem licenciada adequada ou o texto está demasiado longo para incluir o crédito. Tenta outra pesquisa ou envia uma imagem tua."}
            if not text and not images:
                return {"reply": "Escreve o texto do estado ou pede uma imagem para o acompanhar."}
            data = {"texto": text}
        elif action_type in {"projecto", "fatura", "relatorio", "turma"}:
            resource = {
                "projecto": "projectos",
                "fatura": "faturas",
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

    preview = _pending_action(user_id, action_type, data, images)
    return {
        "reply": f"Preparei o {ACTION_LABELS[action_type]}. Revê os dados e confirma abaixo para registar.",
        "pending_action": preview,
    }


def _append_image_credit(text, image, maximum):
    credit = _image_credit(image)
    result = f"{text}\n\n{credit}" if text else credit
    if len(result) > maximum:
        raise AssistantActionError(
            "O texto está demasiado longo para incluir a atribuição obrigatória da imagem. Encurta-o e tenta novamente."
        )
    return result


def _resolve_image(images, image_index):
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
    if action_type == "produto":
        description = data["descricao_produto"]
        if image:
            description = _append_image_credit(description, image, 6000)
        product = Registrar_produto(
            nome_produto=data["nome_produto"],
            descricao_produto=description,
            tipo_produto=data["tipo_produto"],
            preco_produto=data["preco_produto"],
            url_imagem_produto=image["url"],
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
        "fatura": "faturas",
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


def execute_assistant_action(user_id, token, image_index=None):
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

    image = _resolve_image(images, image_index)
    try:
        result = _execute_record(user_id, action_type, data, image)
        db.session.add(AssistantActionExecution(
            action_id=action_id,
            user_id=user_id,
            result=result,
        ))
        db.session.commit()
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

