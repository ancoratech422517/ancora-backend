from collections import Counter
from datetime import date, datetime
import math
import re

import jwt
from flask import Blueprint, current_app, jsonify, request

from models.database import CRMRegistro, Usuario, db


crm_bp = Blueprint("crm", __name__, url_prefix="/api/crm")

CRM_FIELDS = {
    "projectos": {
        "nome": "text", "cliente": "text", "estado": "estado_projecto",
        "orcamento": "number", "prazo": "date", "progresso": "percent",
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
}

CHOICES = {
    "estado_projecto": {"Planeado", "Em curso", "Pausado", "Concluído"},
    "estado_cliente": {"Activo", "Inactivo"},
    "tipo_financeiro": {"Receita", "Despesa"},
    "categoria": {"Vendas", "Parede", "Afiliados", "Ferramentas", "Tráfego Pago"},
    "estado_fatura": {"Pendente", "Paga", "Atrasada"},
    "estado_turma": {"Planeada", "Em curso", "Concluída"},
    "tipo_evento": {"Reunião", "Aula", "Entrega", "Pagamento"},
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

    return result


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


@crm_bp.route("/<string:resource>", methods=["GET", "POST"])
def crm_collection(resource):
    user_id = _user_id_from_session()
    if not user_id:
        return _auth_error()
    if resource not in CRM_FIELDS:
        return jsonify({"error": "Recurso do CRM não encontrado"}), 404

    if request.method == "GET":
        return jsonify({"data": _list_records(user_id, resource)})

    try:
        data = _validate_data(resource, request.get_json(silent=True))
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
        record.dados = _validate_data(resource, request.get_json(silent=True))
        db.session.commit()
    except ValueError as error:
        db.session.rollback()
        return jsonify({"error": str(error)}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha ao atualizar registo do CRM")
        return jsonify({"error": "Não foi possível atualizar o registo"}), 500
    return jsonify({"data": _serialize(record)})


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
