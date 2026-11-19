import hashlib
import hmac
import re
import time
import uuid
from datetime import timezone
from decimal import Decimal, InvalidOperation

import requests
from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError

from models.database import Usuario, WalletDeposit, WalletLedgerEntry, WalletMovement, db


wallet_bp = Blueprint("wallet", __name__)
MAX_DEPOSIT_AMOUNT = Decimal("1000000000000.00")
SUPPORTED_PAYMENT_METHOD = "multicaixa_express"
BITPAY_DEFAULT_BASE_URL = "https://api-sandbox.bitpay.ao/v1"


def _current_user():
    try:
        user_id = int(g.principal["sub"])
    except (AttributeError, KeyError, TypeError, ValueError):
        return None
    return db.session.get(Usuario, user_id)


def _parse_amount(value):
    if isinstance(value, bool) or value is None:
        raise ValueError("O valor do depósito é inválido.")
    try:
        amount = Decimal(str(value))
        normalized = amount.quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        raise ValueError("O valor do depósito é inválido.") from None
    if not amount.is_finite() or amount != normalized:
        raise ValueError("O valor deve ter no máximo duas casas decimais.")
    if normalized != normalized.to_integral_value():
        raise ValueError("A BitPay exige montantes inteiros em kwanzas.")
    if amount < Decimal("100") or amount > MAX_DEPOSIT_AMOUNT:
        raise ValueError("O valor do depósito está fora do intervalo permitido.")
    return normalized


def _amount_string(amount):
    return format(Decimal(amount).quantize(Decimal("0.01")), "f")


def _provider_amount(amount):
    normalized = Decimal(amount).quantize(Decimal("0.01"))
    if normalized != normalized.to_integral_value():
        raise ValueError("A BitPay exige montantes inteiros em kwanzas.")
    return int(normalized)


def _bitpay_base_url():
    base_url = current_app.config.get("BITPAY_API_BASE_URL")
    if not isinstance(base_url, str) or not base_url.strip():
        base_url = BITPAY_DEFAULT_BASE_URL
    base_url = base_url.strip().rstrip("/")
    if not base_url.startswith(("https://api-sandbox.bitpay.ao/v1", "https://api.bitpay.ao/v1")):
        raise ValueError("A URL da API da BitPay não é permitida.")
    return base_url


def _verify_bitpay_signature(raw_body, header):
    if not isinstance(header, str):
        return False
    match = re.search(
        r"(?:^|,)\s*t=(\d+)\s*,\s*v1=([0-9a-f]{64})\s*(?:,|$)",
        header,
        re.IGNORECASE,
    )
    if not match:
        return False
    timestamp = int(match.group(1))
    if abs(time.time() - timestamp) > 600:
        return False
    secret = current_app.config.get("BITPAY_WHSEC")
    if not isinstance(secret, str) or not secret.startswith("whsec_"):
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        f"{timestamp}.{raw_body.decode('utf-8', errors='replace')}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, match.group(2).lower())


def _serialize_deposit(deposit):
    created_at = deposit.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return {
        "reference_id": deposit.reference_id,
        "transaction_id": deposit.provider_transaction_id,
        "amount": _amount_string(deposit.amount),
        "currency": deposit.currency,
        "payment_method": deposit.payment_method,
        "status": deposit.status,
        "created_at": created_at.isoformat(),
    }


def _customer_phone(value):
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 9:
        return f"+244{digits}"
    if len(digits) == 12 and digits.startswith("244"):
        return f"+{digits}"
    return None


def _normalize_account_phone(value):
    customer_phone = _customer_phone(value)
    if customer_phone is None:
        return None
    return customer_phone[-9:]


def _wallet_balance(user_id):
    deposit_total = (
        db.session.query(func.coalesce(func.sum(WalletLedgerEntry.amount), 0))
        .filter(WalletLedgerEntry.user_id == user_id)
        .scalar()
    )
    sent_total = (
        db.session.query(func.coalesce(func.sum(WalletMovement.amount), 0))
        .filter(WalletMovement.sender_id == user_id)
        .scalar()
    )
    received_total = (
        db.session.query(func.coalesce(func.sum(WalletMovement.amount), 0))
        .filter(
            WalletMovement.recipient_id == user_id,
            WalletMovement.movement_type == "TRANSFER",
        )
        .scalar()
    )
    return (
        Decimal(str(deposit_total or 0))
        - Decimal(str(sent_total or 0))
        + Decimal(str(received_total or 0))
    )


@wallet_bp.route("/api/wallet", methods=["GET"])
def wallet_summary():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada."}), 401

    deposit_total = (
        db.session.query(func.coalesce(func.sum(WalletLedgerEntry.amount), 0))
        .filter(WalletLedgerEntry.user_id == user.id)
        .scalar()
    )
    sent_total = (
        db.session.query(func.coalesce(func.sum(WalletMovement.amount), 0))
        .filter(WalletMovement.sender_id == user.id)
        .scalar()
    )
    received_total = (
        db.session.query(func.coalesce(func.sum(WalletMovement.amount), 0))
        .filter(
            WalletMovement.recipient_id == user.id,
            WalletMovement.movement_type == "TRANSFER",
        )
        .scalar()
    )
    balance = (
        Decimal(str(deposit_total or 0))
        - Decimal(str(sent_total or 0))
        + Decimal(str(received_total or 0))
    )
    deposits = (
        WalletDeposit.query
        .filter_by(user_id=user.id)
        .order_by(WalletDeposit.created_at.desc(), WalletDeposit.id.desc())
        .limit(100)
        .all()
    )
    total_incoming = (
        db.session.query(func.coalesce(func.sum(WalletLedgerEntry.amount), 0))
        .filter(
            WalletLedgerEntry.user_id == user.id,
            WalletLedgerEntry.entry_type == "DEPOSIT",
        )
        .scalar()
    )
    movements = (
        WalletMovement.query
        .filter(or_(WalletMovement.sender_id == user.id, WalletMovement.recipient_id == user.id))
        .order_by(WalletMovement.created_at.desc(), WalletMovement.id.desc())
        .limit(100)
        .all()
    )
    transactions = [_serialize_deposit(deposit) for deposit in deposits]
    for movement in movements:
        incoming = movement.recipient_id == user.id and movement.movement_type == "TRANSFER"
        transactions.append({
            "reference_id": movement.reference_id,
            "transaction_id": None,
            "amount": _amount_string(movement.amount),
            "currency": movement.currency,
            "payment_method": "wallet_transfer" if movement.movement_type == "TRANSFER" else "multicaixa_express",
            "status": movement.status,
            "created_at": movement.created_at.isoformat(),
            "direction": "IN" if incoming else "OUT",
            "movement_type": movement.movement_type,
            "account_phone": movement.account_phone,
        })
    transactions.sort(key=lambda item: item["created_at"], reverse=True)
    return jsonify({
        "currency": "AOA",
        "balance": _amount_string(balance or 0),
        "total_incoming": _amount_string(total_incoming or 0),
        "total_outgoing": _amount_string(sent_total or 0),
        "withdrawals_enabled": True,
        "transfers_enabled": True,
        "transactions": transactions[:100],
    })


@wallet_bp.route("/api/wallet/deposits", methods=["POST"])
def create_wallet_deposit():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada."}), 401

    api_key = current_app.config.get("BITPAY_SK")
    try:
        bitpay_base_url = _bitpay_base_url()
    except ValueError as error:
        current_app.logger.error("Invalid BitPay API base URL: %s", error)
        return jsonify({"error": "A integração de pagamentos não está configurada."}), 503
    if not isinstance(api_key, str) or not api_key.strip():
        current_app.logger.error("BitPay secret key is not configured.")
        return jsonify({"error": "A integração de pagamentos não está configurada."}), 503

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or set(payload) - {"amount", "payment_method"}:
        return jsonify({"error": "O pedido do depósito é inválido."}), 400
    try:
        amount = _parse_amount(payload.get("amount"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    payment_method = payload.get("payment_method", SUPPORTED_PAYMENT_METHOD)
    if payment_method != SUPPORTED_PAYMENT_METHOD:
        return jsonify({"error": "Este método de pagamento não está disponível."}), 400

    phone = _customer_phone(user.telefone)
    if phone is None:
        return jsonify({"error": "Atualize o telefone do perfil antes de depositar."}), 422
    mobile = phone[-9:]

    reference_id = f"ANCORA-DEP-{uuid.uuid4().hex.upper()}"
    deposit = WalletDeposit(
        user_id=user.id,
        reference_id=reference_id,
        amount=amount,
        currency="AOA",
        payment_method=payment_method,
        status="PENDING",
    )
    db.session.add(deposit)
    db.session.commit()

    provider_payload = {
        "amount": _provider_amount(amount),
        "currency": "AOA",
        "payment_method": payment_method,
        "customer": {"mobile": mobile},
        "merchant_reference": reference_id,
    }
    try:
        response = requests.post(
            f"{bitpay_base_url}/payment_intents",
            json=provider_payload,
            headers={
                "Authorization": f"Bearer {api_key.strip()}",
                "Content-Type": "application/json",
                "Idempotency-Key": reference_id,
            },
            timeout=(3.05, 20),
        )
    except requests.RequestException:
        current_app.logger.exception(
            "Could not reach BitPay while creating wallet deposit %s.",
            reference_id,
        )
        return jsonify({
            "error": "Não foi possível confirmar a criação do pagamento. O depósito permanece pendente.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502

    if not response.ok:
        if response.status_code < 500:
            deposit.status = "FAILED"
            db.session.commit()
        error_message = ""
        try:
            error_body = response.json()
        except ValueError:
            error_body = None
        if isinstance(error_body, dict):
            candidate = next(
                (
                    error_body.get(field)
                    for field in ("message", "error", "detail")
                    if isinstance(error_body.get(field), str)
                ),
                "",
            )
            error_message = " ".join(candidate.split())
            error_message = re.sub(
                r"(?i)(api[\s_-]*key|authorization|token|secret)\s*[:=]\s*\S+",
                r"\1=[redacted]",
                error_message,
            )
            error_message = re.sub(r"\b[A-Za-z0-9_-]{32,}\b", "[redacted]", error_message)
            error_message = error_message[:200]
        if error_message:
            current_app.logger.error(
                "BitPay rejected wallet deposit %s with HTTP %s: %s.",
                reference_id,
                response.status_code,
                error_message,
            )
        else:
            current_app.logger.error(
                "BitPay rejected wallet deposit %s with HTTP %s.",
                reference_id,
                response.status_code,
            )
        return jsonify({
            "error": "O gateway não aceitou o pedido de depósito.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502

    try:
        provider_result = response.json()
    except ValueError:
        current_app.logger.error("BitPay returned a non-JSON response for %s.", reference_id)
        return jsonify({
            "error": "O gateway devolveu uma resposta inválida; o depósito permanece pendente.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502

    data = provider_result if isinstance(provider_result, dict) else None
    if (
        not isinstance(data, dict)
        or data.get("merchant_reference") != reference_id
        or data.get("currency") != "AOA"
        or not isinstance(data.get("id"), str)
        or not data["id"].strip()
    ):
        current_app.logger.error("BitPay returned an incomplete deposit response for %s.", reference_id)
        return jsonify({
            "error": "A resposta do gateway não corresponde ao depósito; ele permanece pendente.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502

    try:
        provider_amount = _parse_amount(data.get("amount"))
    except ValueError:
        current_app.logger.error("BitPay returned an invalid amount for %s.", reference_id)
        return jsonify({
            "error": "A resposta do gateway tem um valor inválido; o depósito permanece pendente.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502
    if provider_amount != amount:
        current_app.logger.error("BitPay amount mismatch for deposit %s.", reference_id)
        return jsonify({
            "error": "O valor devolvido pelo gateway não corresponde ao pedido.",
            "reference_id": reference_id,
            "status": deposit.status,
        }), 502

    checkout_url = None
    if isinstance(data.get("reference"), dict):
        entity = data["reference"].get("entity")
        number = data["reference"].get("number")
        if isinstance(entity, str) and isinstance(number, str):
            checkout_url = f"{entity} {number}"

    deposit.provider_transaction_id = data["id"].strip()
    deposit.checkout_url = checkout_url
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        current_app.logger.error(
            "BitPay reused a transaction ID while creating deposit %s.",
            reference_id,
        )
        return jsonify({
            "error": "O gateway devolveu um identificador de transação duplicado.",
            "reference_id": reference_id,
            "status": "PENDING",
        }), 502

    return jsonify({
        **_serialize_deposit(deposit),
        "checkout_url": deposit.checkout_url,
    }), 201


@wallet_bp.route("/api/wallet/withdrawals", methods=["POST"])
def create_wallet_withdrawal():
    user = _current_user()
    if user is None:
        return jsonify({"error": "Sessão inválida ou expirada."}), 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or set(payload) - {"amount", "account_phone"}:
        return jsonify({"error": "O pedido de levantamento é inválido."}), 400
    try:
        amount = _parse_amount(payload.get("amount"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    account_phone = _normalize_account_phone(payload.get("account_phone"))
    if account_phone is None:
        return jsonify({"error": "Informe o número de 9 dígitos associado ao Multicaixa Express."}), 400
    balance = _wallet_balance(user.id)
    if amount > balance:
        return jsonify({"error": "Saldo insuficiente.", "balance": _amount_string(balance)}), 409

    reference_id = f"ANCORA-WD-{uuid.uuid4().hex.upper()}"
    movement = WalletMovement(
        reference_id=reference_id,
        sender_id=user.id,
        recipient_id=None,
        account_phone=account_phone,
        movement_type="WITHDRAWAL",
        amount=amount,
        currency="AOA",
        status="PENDING",
    )
    db.session.add(movement)
    db.session.commit()
    return jsonify({
        "reference_id": reference_id,
        "amount": _amount_string(amount),
        "currency": "AOA",
        "account_phone": account_phone,
        "status": "PENDING",
        "message": "Pedido de levantamento reservado. Aguarde a confirmação de processamento.",
    }), 201


@wallet_bp.route("/api/wallet/transfers", methods=["POST"])
def create_wallet_transfer():
    sender = _current_user()
    if sender is None:
        return jsonify({"error": "Sessão inválida ou expirada."}), 401

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or set(payload) - {"amount", "account_phone"}:
        return jsonify({"error": "O pedido de transferência é inválido."}), 400
    try:
        amount = _parse_amount(payload.get("amount"))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    account_phone = _normalize_account_phone(payload.get("account_phone"))
    if account_phone is None:
        return jsonify({"error": "Informe o número de 9 dígitos associado ao Multicaixa Express."}), 400

    recipient = Usuario.query.filter(Usuario.telefone.ilike(f"%{account_phone}%")).first()
    if recipient is None:
        return jsonify({"error": "Não existe uma conta Âncora associada a esse número."}), 404
    if recipient.id == sender.id:
        return jsonify({"error": "Não pode transferir para a sua própria conta."}), 400

    balance = _wallet_balance(sender.id)
    if amount > balance:
        return jsonify({"error": "Saldo insuficiente.", "balance": _amount_string(balance)}), 409

    reference_id = f"ANCORA-TF-{uuid.uuid4().hex.upper()}"
    movement = WalletMovement(
        reference_id=reference_id,
        sender_id=sender.id,
        recipient_id=recipient.id,
        account_phone=account_phone,
        movement_type="TRANSFER",
        amount=amount,
        currency="AOA",
        status="COMPLETED",
    )
    db.session.add(movement)
    db.session.commit()
    return jsonify({
        "reference_id": reference_id,
        "amount": _amount_string(amount),
        "currency": "AOA",
        "recipient_name": recipient.nome,
        "status": "COMPLETED",
    }), 201


@wallet_bp.route("/webhooks/bitpay", methods=["POST"])
def receive_bitpay_webhook():
    secret = current_app.config.get("BITPAY_WHSEC")
    if not isinstance(secret, str) or not secret.startswith("whsec_"):
        current_app.logger.error("BitPay webhook signing secret is not configured.")
        return jsonify({"error": "O webhook não está configurado."}), 503
    if request.content_length is not None and request.content_length > 65536:
        return jsonify({"error": "O evento do webhook excede o tamanho permitido."}), 413

    raw_body = request.get_data(cache=True)
    if len(raw_body) > 65536:
        return jsonify({"error": "O evento do webhook excede o tamanho permitido."}), 413
    if not _verify_bitpay_signature(
        raw_body,
        request.headers.get("BitPay-Signature", ""),
    ):
        return jsonify({"error": "Assinatura inválida."}), 403

    event = request.get_json(silent=True)
    if not isinstance(event, dict):
        return jsonify({"error": "O evento do webhook é inválido."}), 400
    event_type = event.get("type")
    if event_type not in {"payment.succeeded", "payment.failed", "payment.expired", "payment.cancelled"}:
        return jsonify({"received": True, "ignored": True}), 200
    data = event.get("data")
    if not isinstance(data, dict):
        return jsonify({"error": "Os dados do pagamento são inválidos."}), 400
    reference_id = data.get("merchant_reference")
    transaction_id = data.get("id")
    currency = data.get("currency")
    status = data.get("status")
    if (
        not isinstance(reference_id, str)
        or not reference_id
        or not isinstance(transaction_id, str)
        or not transaction_id
        or currency != "AOA"
        or (
            event_type == "payment.succeeded"
            and status != "SUCCEEDED"
        )
    ):
        return jsonify({"error": "Os dados do pagamento são inválidos."}), 400
    try:
        amount = _parse_amount(data.get("amount"))
    except ValueError:
        return jsonify({"error": "O valor do pagamento é inválido."}), 400

    deposit = (
        WalletDeposit.query
        .filter_by(reference_id=reference_id)
        .with_for_update()
        .first()
    )
    if deposit is None:
        current_app.logger.warning(
            "Received a signed BitPay event for unknown reference %s.",
            reference_id,
        )
        return jsonify({"received": True, "ignored": True, "reason": "unknown_reference"}), 200
    if event_type != "payment.succeeded":
        if (
            amount != deposit.amount
            or currency != deposit.currency
            or (
                deposit.provider_transaction_id
                and deposit.provider_transaction_id != transaction_id
            )
        ):
            return jsonify({"error": "O pagamento não corresponde ao depósito pendente."}), 409
        if deposit.status == "COMPLETED":
            return jsonify({"received": True, "duplicate": True}), 200
        if deposit.status != "PENDING":
            return jsonify({"error": "O depósito não está pendente."}), 409
        deposit.provider_transaction_id = transaction_id
        deposit.status = "FAILED"
        db.session.commit()
        return jsonify({"received": True}), 200
    if deposit.status == "COMPLETED":
        if deposit.provider_transaction_id == transaction_id and amount == deposit.amount:
            return jsonify({"received": True, "duplicate": True}), 200
        return jsonify({"error": "A referência já foi liquidada com outros dados."}), 409
    if deposit.status != "PENDING":
        return jsonify({"error": "O depósito não está pendente."}), 409
    if (
        amount != deposit.amount
        or currency != deposit.currency
        or (
            deposit.provider_transaction_id
            and deposit.provider_transaction_id != transaction_id
        )
    ):
        current_app.logger.error(
            "BitPay payment details do not match pending deposit %s.",
            reference_id,
        )
        return jsonify({"error": "O pagamento não corresponde ao depósito pendente."}), 409

    deposit.provider_transaction_id = transaction_id
    deposit.status = "COMPLETED"
    db.session.add(WalletLedgerEntry(
        user_id=deposit.user_id,
        deposit_id=deposit.id,
        entry_type="DEPOSIT",
        amount=deposit.amount,
        currency=deposit.currency,
    ))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        deposit = WalletDeposit.query.filter_by(reference_id=reference_id).first()
        ledger_entry = (
            WalletLedgerEntry.query
            .filter_by(deposit_id=deposit.id)
            .first()
            if deposit is not None
            else None
        )
        if (
            deposit is not None
            and deposit.status == "COMPLETED"
            and deposit.provider_transaction_id == transaction_id
            and ledger_entry is not None
        ):
            return jsonify({"received": True, "duplicate": True}), 200
        current_app.logger.exception(
            "Could not record BitPay webhook for reference %s.",
            reference_id,
        )
        return jsonify({"error": "Não foi possível registar o pagamento."}), 409

    return jsonify({"received": True}), 200
