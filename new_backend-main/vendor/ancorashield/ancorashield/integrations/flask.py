"""Decoradores Flask opcionais; instale com ``ancorashield[flask]``."""

from __future__ import annotations

import base64
import binascii
import hashlib
import json
from collections.abc import Callable, Iterable, Mapping
from functools import wraps
from typing import Any, TypeVar, cast

from flask import Flask, Response, current_app, g, jsonify, make_response, request
from werkzeug.exceptions import BadRequest, UnsupportedMediaType

from ancorashield.auth.rate_limit import RateLimiter
from ancorashield.auth.tokens import SessionTokenManager
from ancorashield.audit import AuditLog
from ancorashield.crypto import _AEADCipher
from ancorashield.exceptions import AuthenticationError, DecryptionError
from ancorashield.validation import InputValidationError, Validator, validate_object

F = TypeVar("F", bound=Callable[..., Any])
Policy = Callable[[Mapping[str, Any], Mapping[str, Any]], bool]
_SECURITY_EXTENSION = "ancorashield.api_security"


class ApiSecurity:
    """Inicializa rate limiting e fornece dependências às rotas seguras."""

    def __init__(
        self,
        *,
        token_manager: SessionTokenManager,
        audit_log: AuditLog,
        rate_limiter: RateLimiter,
        rate_limit_exempt_endpoints: Iterable[str] = (),
        max_request_bytes: int = 1_048_576,
    ) -> None:
        if max_request_bytes < 1:
            raise ValueError("max_request_bytes deve ser positivo.")
        self.token_manager = token_manager
        self.audit_log = audit_log
        self.rate_limiter = rate_limiter
        self.rate_limit_exempt_endpoints = frozenset(rate_limit_exempt_endpoints)
        self.max_request_bytes = max_request_bytes

    def init_app(self, app: Flask) -> None:
        """Instala o limite de corpo e o rate limiter por endereço remoto."""
        existing_limit = app.config.get("MAX_CONTENT_LENGTH")
        if existing_limit is None or existing_limit > self.max_request_bytes:
            app.config["MAX_CONTENT_LENGTH"] = self.max_request_bytes
        app.extensions[_SECURITY_EXTENSION] = self

        @app.before_request
        def enforce_rate_limit() -> Response | None:
            if request.endpoint in self.rate_limit_exempt_endpoints:
                return None
            client_key = request.remote_addr or "unknown"
            allowed, retry_after = self.rate_limiter.check(client_key)
            if allowed:
                return None
            client_digest = hashlib.sha256(client_key.encode("utf-8")).hexdigest()
            self.audit_log.append(
                "api.rate_limited",
                {"client_id_hash": client_digest, "endpoint": request.endpoint or ""},
            )
            response = jsonify(error="rate limit exceeded")
            response.status_code = 429
            response.headers["Retry-After"] = str(retry_after)
            return response


def secure_route(
    *,
    required_roles: Iterable[str] = (),
    policy: Policy | None = None,
    input_schema: Mapping[str, Validator[Any]] | None = None,
) -> Callable[[F], F]:
    """Exige Bearer JWE, roles (qualquer uma) e validação opcional de JSON.

    Deve ser aplicado abaixo do decorador de registro de rota do Flask.
    """
    if isinstance(required_roles, str):
        raise TypeError("required_roles deve ser uma coleção de papéis.")
    roles_required = tuple(required_roles)
    if any(not isinstance(role, str) or not role for role in roles_required):
        raise ValueError("required_roles deve conter papéis não vazios.")

    def decorator(view: F) -> F:
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            security = current_app.extensions.get(_SECURITY_EXTENSION)
            if not isinstance(security, ApiSecurity):
                raise RuntimeError("ApiSecurity.init_app(app) não foi chamado.")

            authorization = request.headers.get("Authorization", "")
            scheme, separator, token = authorization.partition(" ")
            if scheme.lower() != "bearer" or not separator or not token or " " in token:
                security.audit_log.append(
                    "api.access_denied",
                    {"reason": "missing_or_malformed_bearer", "endpoint": request.endpoint or ""},
                )
                return jsonify(error="unauthorized"), 401

            try:
                principal = security.token_manager.verify(token)
            except AuthenticationError:
                security.audit_log.append(
                    "api.access_denied",
                    {"reason": "invalid_token", "endpoint": request.endpoint or ""},
                )
                return jsonify(error="unauthorized"), 401

            granted_roles = principal["roles"]
            if roles_required and not set(roles_required).intersection(granted_roles):
                security.audit_log.append(
                    "api.access_denied",
                    {
                        "reason": "insufficient_role",
                        "subject": principal["sub"],
                        "endpoint": request.endpoint or "",
                    },
                )
                return jsonify(error="forbidden"), 403

            payload: dict[str, Any] = {}
            if input_schema is not None:
                try:
                    raw_payload = request.get_json()
                    payload = validate_object(raw_payload, input_schema)
                except (BadRequest, UnsupportedMediaType, InputValidationError):
                    security.audit_log.append(
                        "api.input_rejected",
                        {
                            "subject": principal["sub"],
                            "endpoint": request.endpoint or "",
                        },
                    )
                    return jsonify(error="invalid request payload"), 400
                g.secure_payload = payload

            if policy is not None and not policy(principal, payload):
                security.audit_log.append(
                    "api.access_denied",
                    {
                        "reason": "policy_denied",
                        "subject": principal["sub"],
                        "endpoint": request.endpoint or "",
                    },
                )
                return jsonify(error="forbidden"), 403

            g.principal = principal
            security.audit_log.append(
                "api.access_granted",
                {"subject": principal["sub"], "endpoint": request.endpoint or ""},
            )
            return view(*args, **kwargs)

        return cast(F, wrapped)

    return decorator


def require_roles(*required_roles: str) -> Callable[[F], F]:
    """Exige roles em ``g.principal``; autenticação deve ser configurada à parte."""
    if not required_roles or any(not role for role in required_roles):
        raise ValueError("Informe ao menos uma role válida.")

    def decorator(view: F) -> F:
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            principal = getattr(g, "principal", None)
            if principal is None:
                return jsonify(error="unauthorized"), 401
            roles = (
                principal.get("roles", ())
                if isinstance(principal, Mapping)
                else getattr(principal, "roles", ())
            )
            if (
                isinstance(roles, str)
                or not isinstance(roles, (set, frozenset, list, tuple))
                or any(not isinstance(role, str) for role in roles)
            ):
                return jsonify(error="forbidden"), 403
            if not set(required_roles).intersection(roles):
                return jsonify(error="forbidden"), 403
            return view(*args, **kwargs)

        return cast(F, wrapped)

    return decorator


def decrypt_payload(
    cipher_resolver: Callable[[], _AEADCipher],
    *,
    aad_resolver: Callable[[], bytes] | None = None,
) -> Callable[[F], F]:
    """Descriptografa JSON ``{ciphertext: base64}`` e define ``g.secure_payload``."""
    def decorator(view: F) -> F:
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            try:
                body = request.get_json()
                if not isinstance(body, dict) or not isinstance(
                    body.get("ciphertext"), str
                ):
                    return jsonify(error="invalid encrypted payload"), 400
                envelope = base64.b64decode(body["ciphertext"], validate=True)
                aad = aad_resolver() if aad_resolver is not None else None
                plaintext = cipher_resolver().decrypt(envelope, aad=aad)
                payload = json.loads(plaintext)
                if not isinstance(payload, dict):
                    return jsonify(error="invalid encrypted payload"), 400
            except (DecryptionError, ValueError, TypeError, binascii.Error):
                return jsonify(error="invalid encrypted payload"), 400
            g.secure_payload = payload
            return view(*args, **kwargs)

        return cast(F, wrapped)

    return decorator


def encrypted_json_response(
    cipher_resolver: Callable[[], _AEADCipher],
    *,
    aad_resolver: Callable[[], bytes] | None = None,
) -> Callable[[F], F]:
    """Criptografa o JSON de retorno da rota e o envolve em base64."""
    def decorator(view: F) -> F:
        @wraps(view)
        def wrapped(*args: Any, **kwargs: Any) -> Response:
            result = view(*args, **kwargs)
            response = make_response(result)
            aad = aad_resolver() if aad_resolver is not None else None
            envelope = cipher_resolver().encrypt(response.get_data(), aad=aad)
            encrypted_response = jsonify(
                ciphertext=base64.b64encode(envelope).decode("ascii")
            )
            encrypted_response.status_code = response.status_code
            return encrypted_response

        return cast(F, wrapped)

    return decorator
