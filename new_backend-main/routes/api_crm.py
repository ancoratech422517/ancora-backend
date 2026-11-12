from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
import hashlib
import hmac
import math
import re

import jwt
from flask import Blueprint, current_app, jsonify, request

from models.database import CRMRegistro, Registrar_produto, Turma_Aula, Usuario, db


crm_bp = Blueprint("crm", __name__, url_prefix="/api/crm")

CRM_FIELDS = {
    "projectos": {
        "nome": "text", "cliente": "text", "estado": "estado_projecto",
        "orcamento": "number", "prazo": "date", "progresso": "percent",
        "arrendamento": "arrendamento",
    },
    "clientes": {
        "nome": "text", "email": "email", "telefone": "text",
        "empresa": "text", "estado": "estado_cliente",
    },
    "financeiro": {
        "descricao": "text", "tipo": "tipo_financeiro", "categoria": "categoria",
        "valor": "number", "data": "date",
    },
    "faturas": {
        "numero": "text", "cliente": "text", "valor": "number",
        "emissao": "date", "vencimento": "date", "estado": "estado_fatura",
    },
    "turmas": {
        "nome": "text", "formador": "text", "alunos": "count",
        "horario": "text", "inicio": "date", "estado": "estado_turma",
    },
    "calendario": {
        "titulo": "text", "data": "date", "hora": "time", "tipo": "tipo_evento",
    },
    "anuncios": {},
    "leads": {},
}

CHOICES = {
    "estado_projecto": {"Planeado", "Em curso", "Pausado", "Concluído"},
    "estado_cliente": {"Activo", "Inactivo"},
    "tipo_financeiro": {"Receita", "Despesa"},
    "categoria": {"Vendas", "Parede", "Afiliados", "Ferramentas", "Tráfego Pago"},
    "estado_fatura": {"Pendente", "Paga", "Atrasada"},
    "estado_turma": {"Planeada", "Em curso", "Concluída"},
    "tipo_evento": {"Reunião", "Aula", "Entrega", "Pagamento"},
    "origem_anuncio": {"produto", "curso"},
}

MONTHS_PT = ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")


def _user_id_from_session():
    token = request.cookies.get("token_sessao")
    if not token:
        return None
    try:
        claims = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"],
        )
        if claims.get("type") != "access":
            return None
        user_id = int(claims.get("id"))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        return None

    return user_id if db.session.get(Usuario, user_id) else None


def _auth_error():
    return jsonify({"error": "Sessão inválida ou expirada"}), 401


def _validate_data(resource, incoming):
    if not isinstance(incoming, dict):
        raise ValueError("O corpo do pedido deve ser um objeto JSON")

    schema = CRM_FIELDS[resource]
    unknown = set(incoming) - set(schema) - {"id"}
    if unknown:
        raise ValueError("O pedido contém campos não permitidos")

    result = {}
    for field, kind in schema.items():
        value = incoming.get(field)
        if kind in {"text", "email"}:
            if not isinstance(value, str):
                raise ValueError(f"O campo {field} é obrigatório")
            value = value.strip()
            limit = 500 if field in {"descricao", "horario"} else 255
            if not value or len(value) > limit:
                raise ValueError(f"O campo {field} deve ter entre 1 e {limit} caracteres")
            if kind == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                raise ValueError("O endereço de email é inválido")
            result[field] = value
        elif kind in CHOICES:
            if not isinstance(value, str) or value not in CHOICES[kind]:
                raise ValueError(f"O valor indicado para {field} não é válido")
            result[field] = value
        elif kind in {"number", "count", "percent"}:
            if isinstance(value, bool):
                raise ValueError(f"O campo {field} deve ser numérico")
            try:
                number = float(value)
            except (TypeError, ValueError):
                raise ValueError(f"O campo {field} deve ser numérico")
            if not math.isfinite(number) or not number.is_integer():
                raise ValueError(f"O campo {field} deve ser um número inteiro válido")
            number = int(number)
            maximum = 100 if kind == "percent" else 1_000_000_000_000
            if number < 0 or number > maximum:
                raise ValueError(f"O campo {field} está fora do intervalo permitido")
            result[field] = number
        elif kind == "date":
            if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                raise ValueError(f"O campo {field} deve conter uma data válida")
            try:
                date.fromisoformat(value)
            except ValueError:
                raise ValueError(f"O campo {field} deve conter uma data válida")
            result[field] = value
        elif kind == "time":
            if not isinstance(value, str) or not re.fullmatch(r"\d{2}:\d{2}", value):
                raise ValueError("A hora deve estar no formato HH:MM")
            try:
                datetime.strptime(value, "%H:%M")
            except ValueError:
                raise ValueError("A hora deve estar no formato HH:MM")
            result[field] = value
        elif kind == "arrendamento":
            if value is None:
                continue
            if not isinstance(value, dict) or set(value) != {
                "inquilino", "data_pagamento", "valor_pago", "data_fim", "senhoria"
            }:
                raise ValueError("Os dados do arrendamento são inválidos")

            inquilino = value.get("inquilino")
            senhoria = value.get("senhoria")
            if not isinstance(inquilino, str) or not inquilino.strip() or len(inquilino.strip()) > 255:
                raise ValueError("O nome do inquilino deve ter entre 1 e 255 caracteres")
            if not isinstance(senhoria, str) or not senhoria.strip() or len(senhoria.strip()) > 255:
                raise ValueError("O nome da senhoria deve ter entre 1 e 255 caracteres")

            valor_pago = value.get("valor_pago")
            if (
                isinstance(valor_pago, bool)
                or not isinstance(valor_pago, (int, float))
                or not math.isfinite(valor_pago)
                or valor_pago < 0
                or valor_pago > 1_000_000_000_000
            ):
                raise ValueError("O valor pago deve ser numérico e não negativo")
            valor_pago = round(float(valor_pago), 2)

            datas = {}
            for campo, descricao in (
                ("data_pagamento", "pagamento"),
                ("data_fim", "término do arrendamento"),
            ):
                data = value.get(campo)
                if not isinstance(data, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", data):
                    raise ValueError(f"A data de {descricao} é inválida")
                try:
                    date.fromisoformat(data)
                except ValueError:
                    raise ValueError(f"A data de {descricao} é inválida")
                datas[campo] = data

            result[field] = {
                "inquilino": inquilino.strip(),
                **datas,
                "valor_pago": int(valor_pago) if valor_pago.is_integer() else valor_pago,
                "senhoria": senhoria.strip(),
            }

    return result


def _validate_advertisement(user_id, incoming):
    allowed = {
        "origem_tipo", "origem_id", "preco", "badge", "descCurta",
        "descLonga", "beneficios", "proprietario", "whatsapp",
    }
    if not isinstance(incoming, dict):
        raise ValueError("O corpo do pedido deve ser um objeto JSON")
    if set(incoming) - allowed:
        raise ValueError("O pedido contém campos não permitidos")

    origem_tipo = incoming.get("origem_tipo")
    if not isinstance(origem_tipo, str) or origem_tipo not in CHOICES["origem_anuncio"]:
        raise ValueError("Selecione um produto ou curso válido")
    raw_origem_id = incoming.get("origem_id")
    if isinstance(raw_origem_id, bool) or not isinstance(raw_origem_id, (int, str)):
        raise ValueError("Selecione um produto ou curso válido")
    try:
        origem_id = int(raw_origem_id)
    except ValueError:
        raise ValueError("Selecione um produto ou curso válido")
    if origem_id <= 0:
        raise ValueError("Selecione um produto ou curso válido")

    if origem_tipo == "produto":
        origem = Registrar_produto.query.filter_by(
            id=origem_id,
            id_usuario=user_id,
        ).first()
        if not origem:
            raise ValueError("O produto selecionado não pertence à sua conta")
        titulo = origem.nome_produto
        categoria = origem.tipo_produto
        preco = origem.preco_produto
        imagem = origem.url_imagem_produto
    else:
        origem = Turma_Aula.query.filter_by(
            id=origem_id,
            id_admin_Turma=user_id,
            tipo_usuario_Turma="admin",
        ).first()
        if not origem:
            raise ValueError("O curso selecionado não pertence à sua conta")
        titulo = origem.nome_Turma
        categoria = "Cursos"
        preco = incoming.get("preco")
        imagem = origem.imagem_perfil_Turma

    if not isinstance(titulo, str) or not titulo.strip():
        raise ValueError("O produto ou curso não tem um título válido")
    if not isinstance(imagem, str) or not imagem.strip() or imagem == "None":
        raise ValueError("O produto ou curso selecionado não tem uma imagem")
    if not isinstance(categoria, str) or not categoria.strip():
        raise ValueError("O produto selecionado não tem uma categoria válida")

    def text(field, label, maximum, required=False, default=""):
        value = incoming.get(field, default)
        if value is None:
            value = default
        if not isinstance(value, str):
            raise ValueError(f"O campo {label} é inválido")
        value = value.strip()
        if required and not value:
            raise ValueError(f"O campo {label} é obrigatório")
        if len(value) > maximum:
            raise ValueError(f"O campo {label} excede o limite de {maximum} caracteres")
        return value

    preco = preco if origem_tipo == "produto" else text("preco", "preço", 100, required=True)
    if not isinstance(preco, str) or not preco.strip():
        raise ValueError("O produto ou curso não tem um preço válido")
    whatsapp = text("whatsapp", "WhatsApp", 32, required=True)
    telefone = re.sub(r"\D", "", whatsapp)
    if not 8 <= len(telefone) <= 15:
        raise ValueError("Indique um número de WhatsApp válido")

    return {
        "origem_tipo": origem_tipo,
        "origem_id": origem_id,
        "title": titulo.strip()[:255],
        "categoria": categoria.strip()[:255],
        "preco": preco.strip()[:100],
        "img": imagem.strip(),
        "badge": text("badge", "destaque", 40, default="NOVO") or "NOVO",
        "descCurta": text("descCurta", "descrição curta", 255),
        "descLonga": text("descLonga", "descrição completa", 2000),
        "beneficios": text("beneficios", "benefícios", 1000),
        "proprietario": text("proprietario", "responsável", 255, required=True),
        "whatsapp": telefone,
    }


def _serialize(record):
    return {"id": record.id, **record.dados}


def _list_records(user_id, resource):
    records = (
        CRMRegistro.query
        .filter_by(user_id=user_id, recurso=resource)
        .order_by(CRMRegistro.id.asc())
        .all()
    )
    return [_serialize(record) for record in records]


def _hash_visitor(visitor_id):
    if visitor_id is None:
        return None
    if not isinstance(visitor_id, str) or not 16 <= len(visitor_id) <= 128:
        raise ValueError("O identificador anónimo do visitante é inválido")

    secret = current_app.config.get("SECRET_KEY")
    if not isinstance(secret, str) or not secret:
        raise ValueError("Não foi possível processar as métricas do anúncio")
    return hmac.new(
        secret.encode("utf-8"),
        visitor_id.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _parse_utc_timestamp(value):
    if not isinstance(value, str):
        return None
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


def _build_ad_metrics(user_id, period):
    period_days = {"7d": 7, "30d": 30, "90d": 90}[period]
    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=period_days - 1)
    start_at = datetime.combine(start_day, datetime.min.time(), tzinfo=timezone.utc)
    end_at = datetime.combine(today + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    advertisements = _list_records(user_id, "anuncios")
    advertisement_ids = {str(advertisement["id"]) for advertisement in advertisements}
    events = CRMRegistro.query.filter_by(
        user_id=user_id,
        recurso="anuncio_eventos",
    ).all()
    counts_by_ad = defaultdict(Counter)
    visitors_by_ad = defaultdict(set)
    visitors_total = set()
    daily = defaultdict(Counter)

    for event in events:
        data = event.dados
        ad_id = str(data.get("anuncio_id", ""))
        event_type = data.get("tipo")
        if ad_id not in advertisement_ids or event_type not in {"visualizacao", "clique", "lead"}:
            continue
        timestamp = _parse_utc_timestamp(data.get("criado_em"))
        if timestamp is None or timestamp < start_at or timestamp >= end_at:
            continue

        counts_by_ad[ad_id][event_type] += 1
        daily[timestamp.date().isoformat()][event_type] += 1
        visitor_hash = data.get("visitor_hash")
        if event_type == "visualizacao" and isinstance(visitor_hash, str):
            visitors_by_ad[ad_id].add(visitor_hash)
            visitors_total.add(visitor_hash)

    ad_metrics = []
    totals = Counter(visualizacoes=0, cliques=0, leads=0)
    for advertisement in advertisements:
        ad_id = str(advertisement["id"])
        counts = counts_by_ad[ad_id]
        views = counts["visualizacao"]
        clicks = counts["clique"]
        leads = counts["lead"]
        unique_visitors = len(visitors_by_ad[ad_id])
        totals.update({
            "visualizacoes": views,
            "cliques": clicks,
            "leads": leads,
        })
        ad_metrics.append({
            "id": advertisement["id"],
            "title": advertisement["title"],
            "categoria": advertisement["categoria"],
            "visualizacoes": views,
            "visitantes_unicos": unique_visitors,
            "cliques": clicks,
            "leads": leads,
            "taxa_conversao": round(leads / views * 100, 2) if views else 0,
        })

    series = []
    for offset in range(period_days):
        day = start_day + timedelta(days=offset)
        values = daily[day.isoformat()]
        series.append({
            "data": day.isoformat(),
            "visualizacoes": values["visualizacao"],
            "cliques": values["clique"],
            "leads": values["lead"],
        })

    totals["visitantes_unicos"] = len(visitors_total)
    totals["taxa_conversao"] = (
        round(totals["leads"] / totals["visualizacoes"] * 100, 2)
        if totals["visualizacoes"]
        else 0
    )
    return {
        "periodo": period,
        "totais": dict(totals),
        "serie": series,
        "anuncios": ad_metrics,
    }


def _record_ad_event(advertisement, event_type, visitor_hash=None):
    data = {
        "anuncio_id": advertisement.id,
        "tipo": event_type,
        "criado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    if visitor_hash:
        data["visitor_hash"] = visitor_hash
    event = CRMRegistro(
        user_id=advertisement.user_id,
        recurso="anuncio_eventos",
        dados=data,
    )
    db.session.add(event)


@crm_bp.route("/<string:resource>", methods=["GET", "POST"])
def crm_collection(resource):
    user_id = _user_id_from_session()
    if not user_id:
        return _auth_error()
    if resource not in CRM_FIELDS:
        return jsonify({"error": "Recurso do CRM não encontrado"}), 404

    if request.method == "GET":
        return jsonify({"data": _list_records(user_id, resource)})

    if resource == "leads":
        return jsonify({"error": "Os leads são criados através dos anúncios públicos"}), 405

    try:
        incoming = request.get_json(silent=True)
        data = (
            _validate_advertisement(user_id, incoming)
            if resource == "anuncios"
            else _validate_data(resource, incoming)
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    record = CRMRegistro(user_id=user_id, recurso=resource, dados=data)
    try:
        db.session.add(record)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao criar registo do CRM")
        return jsonify({"error": "Não foi possível guardar o registo"}), 500
    return jsonify({"data": _serialize(record)}), 201


@crm_bp.route("/<string:resource>/<int:record_id>", methods=["PUT", "DELETE"])
def crm_record(resource, record_id):
    user_id = _user_id_from_session()
    if not user_id:
        return _auth_error()
    if resource not in CRM_FIELDS:
        return jsonify({"error": "Recurso do CRM não encontrado"}), 404
    if resource == "leads" and request.method == "PUT":
        return jsonify({"error": "Os dados de contacto dos leads não podem ser alterados"}), 405

    record = CRMRegistro.query.filter_by(
        id=record_id,
        user_id=user_id,
        recurso=resource,
    ).first()
    if not record:
        return jsonify({"error": "Registo não encontrado"}), 404

    if request.method == "DELETE":
        try:
            db.session.delete(record)
            db.session.commit()
        except Exception:
            db.session.rollback()
            current_app.logger.exception("Falha ao eliminar registo do CRM")
            return jsonify({"error": "Não foi possível eliminar o registo"}), 500
        return "", 204

    try:
        incoming = request.get_json(silent=True)
        record.dados = (
            _validate_advertisement(user_id, incoming)
            if resource == "anuncios"
            else _validate_data(resource, incoming)
        )
        db.session.commit()
    except ValueError as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao atualizar registo do CRM")
        return jsonify({"error": "Não foi possível atualizar o registo"}), 500
    return jsonify({"data": _serialize(record)})


@crm_bp.route("/anuncios/metricas", methods=["GET"])
def crm_advertisement_metrics():
    user_id = _user_id_from_session()
    if not user_id:
        return _auth_error()
    period = request.args.get("periodo", "30d")
    if period not in {"7d", "30d", "90d"}:
        return jsonify({"error": "O período das métricas é inválido"}), 400
    return jsonify({"data": _build_ad_metrics(user_id, period)})


@crm_bp.route("/public/anuncios/<int:record_id>", methods=["GET"])
def crm_public_advertisement(record_id):
    record = CRMRegistro.query.filter_by(
        id=record_id,
        recurso="anuncios",
    ).first()
    if not record:
        return jsonify({"error": "Anúncio não encontrado"}), 404
    public_fields = (
        "title", "categoria", "preco", "badge", "img", "descCurta",
        "descLonga", "beneficios", "proprietario", "whatsapp",
    )
    return jsonify({
        "data": {
            "id": record.id,
            **{field: record.dados[field] for field in public_fields},
        },
    })


@crm_bp.route("/public/anuncios/<int:record_id>/eventos", methods=["POST"])
def crm_public_advertisement_event(record_id):
    advertisement = CRMRegistro.query.filter_by(
        id=record_id,
        recurso="anuncios",
    ).first()
    if not advertisement:
        return jsonify({"error": "Anúncio não encontrado"}), 404

    incoming = request.get_json(silent=True)
    allowed = {"tipo", "visitante"}
    if not isinstance(incoming, dict) or set(incoming) - allowed or "tipo" not in incoming:
        return jsonify({"error": "O evento do anúncio é inválido"}), 400
    event_type = incoming.get("tipo")
    if not isinstance(event_type, str) or event_type not in {"visualizacao", "clique"}:
        return jsonify({"error": "O evento do anúncio é inválido"}), 400
    try:
        visitor_hash = _hash_visitor(incoming.get("visitante"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    try:
        _record_ad_event(advertisement, event_type, visitor_hash)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar evento do anúncio")
        return jsonify({"error": "Não foi possível registar a métrica"}), 500
    return "", 204


@crm_bp.route("/public/anuncios/<int:record_id>/leads", methods=["POST"])
def crm_public_advertisement_lead(record_id):
    advertisement = CRMRegistro.query.filter_by(
        id=record_id,
        recurso="anuncios",
    ).first()
    if not advertisement:
        return jsonify({"error": "Anúncio não encontrado"}), 404

    incoming = request.get_json(silent=True)
    allowed = {"nome", "telefone", "email", "visitante"}
    if not isinstance(incoming, dict) or set(incoming) - allowed:
        return jsonify({"error": "Os dados do lead são inválidos"}), 400

    nome = incoming.get("nome")
    telefone = incoming.get("telefone")
    email = incoming.get("email", "")
    if not isinstance(nome, str) or not nome.strip() or len(nome.strip()) > 120:
        return jsonify({"error": "Indique um nome válido"}), 400
    if not isinstance(telefone, str):
        return jsonify({"error": "Indique um WhatsApp válido"}), 400
    telefone = re.sub(r"\D", "", telefone)
    if not 8 <= len(telefone) <= 15:
        return jsonify({"error": "Indique um WhatsApp válido"}), 400
    if not isinstance(email, str) or len(email.strip()) > 255:
        return jsonify({"error": "O endereço de email é inválido"}), 400
    email = email.strip()
    if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return jsonify({"error": "O endereço de email é inválido"}), 400
    try:
        visitor_hash = _hash_visitor(incoming.get("visitante"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    lead = CRMRegistro(
        user_id=advertisement.user_id,
        recurso="leads",
        dados={
            "nome": nome.strip(),
            "telefone": telefone,
            "email": email,
            "anuncio_id": advertisement.id,
            "anuncio": advertisement.dados["title"],
            "categoria": advertisement.dados["categoria"],
            "estado": "Novo",
            "criado_em": created_at,
        },
    )
    try:
        db.session.add(lead)
        _record_ad_event(advertisement, "lead", visitor_hash)
        db.session.commit()
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao registar lead de anúncio")
        return jsonify({"error": "Não foi possível guardar o seu interesse"}), 500
    return jsonify({"data": _serialize(lead)}), 201


def _count_by(records, field):
    counts = Counter(record.get(field) or "Sem estado" for record in records)
    return [{"nome": name, "valor": count} for name, count in counts.items()]


def _add_months(month_start, offset):
    month_index = month_start.year * 12 + month_start.month - 1 + offset
    return date(month_index // 12, month_index % 12 + 1, 1)


def _build_dashboard(user_id):
    finance = _list_records(user_id, "financeiro")
    projects = _list_records(user_id, "projectos")
    invoices = _list_records(user_id, "faturas")

    this_month = date.today().replace(day=1)
    series = [
        {
            "m": MONTHS_PT[month.month - 1],
            "k": month.strftime("%Y-%m"),
            "r": 0,
            "d": 0,
        }
        for month in (_add_months(this_month, offset) for offset in range(-5, 1))
    ]
    series_by_month = {item["k"]: item for item in series}
    categories = {}
    totals = {"Receita": 0, "Despesa": 0}

    for record in finance:
        value = record["valor"]
        kind = record["tipo"]
        if kind in totals:
            totals[kind] += value
        month = series_by_month.get(record["data"][:7])
        if month:
            month["r" if kind == "Receita" else "d"] += value
        if kind == "Despesa":
            category = record["categoria"]
            categories[category] = categories.get(category, 0) + value

    current, previous = series[-1], series[-2]

    def change(value, prior):
        return round((value - prior) / prior * 100) if prior else 0

    open_invoices = [invoice for invoice in invoices if invoice["estado"] != "Paga"]
    cats = [
        {"nome": name, "valor": value}
        for name, value in sorted(categories.items(), key=lambda item: item[1], reverse=True)
    ]

    return {
        "kpi": {
            "saldo": totals["Receita"] - totals["Despesa"],
            "recebido": current["r"],
            "gastos": current["d"],
            "dRec": change(current["r"], previous["r"]),
            "dGas": change(current["d"], previous["d"]),
            "activos": sum(project.get("estado") == "Em curso" for project in projects),
            "totalProj": len(projects),
            "pendente": sum(invoice["valor"] for invoice in open_invoices),
            "nPend": len(open_invoices),
        },
        "serie": series,
        "cats": cats,
        "projEstado": _count_by(projects, "estado"),
        "fatEstado": _count_by(invoices, "estado"),
    }


@crm_bp.route("/dashboard", methods=["GET"])
def crm_dashboard():
    user_id = _user_id_from_session()
    if not user_id:
        return _auth_error()
    return jsonify(_build_dashboard(user_id))
