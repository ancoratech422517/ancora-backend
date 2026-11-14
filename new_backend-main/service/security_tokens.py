import base64
import binascii
from collections.abc import Iterable
from typing import Any

from ancorashield import SessionTokenManager
from ancorashield.auth.rate_limit import RateLimiter
from ancorashield.integrations.flask import ApiSecurity, secure_route
from flask import Flask, current_app, request


ACCESS_TOKEN_MANAGER_KEY = "ancorashield.access_token_manager"
REFRESH_TOKEN_MANAGER_KEY = "ancorashield.refresh_token_manager"
UPLOAD_TOKEN_MANAGER_KEY = "ancorashield.upload_token_manager"
SECURITY_EXTENSION_KEY = "ancorashield.api_security"
PUBLIC_PATHS = {"/Login", "/refresh", "/api/Registrar"}


def _encoded_pem(app: Flask, setting: str) -> bytes:
    value = app.config.get(setting)
    if not isinstance(value, str) or not value:
        raise RuntimeError(f"Configure {setting} with a base64-encoded PEM key.")
    try:
        pem = base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        raise RuntimeError(f"{setting} must be valid base64.") from None
    if b"-----BEGIN " not in pem:
        raise RuntimeError(f"{setting} must contain a PEM key.")
    return pem


def initialize_api_security(app: Flask) -> None:
    issuer = app.config.get("ANCORASHIELD_TOKEN_ISSUER")
    audience = app.config.get("ANCORASHIELD_TOKEN_AUDIENCE")
    if not isinstance(issuer, str) or not issuer.strip():
        raise RuntimeError("Configure ANCORASHIELD_TOKEN_ISSUER.")
    if not isinstance(audience, str) or not audience.strip():
        raise RuntimeError("Configure ANCORASHIELD_TOKEN_AUDIENCE.")

    password = app.config.get("ANCORASHIELD_TOKEN_KEY_PASSWORD")
    if not isinstance(password, str) or not password:
        raise RuntimeError("Configure ANCORASHIELD_TOKEN_KEY_PASSWORD.")
    password_bytes = password.encode("utf-8")

    key_options: dict[str, Any] = {
        "signing_private_pem": _encoded_pem(
            app, "ANCORASHIELD_TOKEN_SIGNING_PRIVATE_PEM"
        ),
        "verification_public_pem": _encoded_pem(
            app, "ANCORASHIELD_TOKEN_VERIFY_PUBLIC_PEM"
        ),
        "encryption_public_pem": _encoded_pem(
            app, "ANCORASHIELD_TOKEN_ENCRYPT_PUBLIC_PEM"
        ),
        "decryption_private_pem": _encoded_pem(
            app, "ANCORASHIELD_TOKEN_DECRYPT_PRIVATE_PEM"
        ),
        "signing_private_password": password_bytes,
        "decryption_private_password": password_bytes,
        "issuer": issuer.strip(),
        "audience": audience.strip(),
    }

    access_manager = SessionTokenManager.from_pem(
        **key_options,
        token_ttl_seconds=900,
    )
    refresh_manager = SessionTokenManager.from_pem(
        **key_options,
        token_ttl_seconds=7 * 24 * 60 * 60,
    )
    upload_manager = SessionTokenManager.from_pem(
        **key_options,
        token_ttl_seconds=60 * 60,
    )
    app.extensions[ACCESS_TOKEN_MANAGER_KEY] = access_manager
    app.extensions[REFRESH_TOKEN_MANAGER_KEY] = refresh_manager
    app.extensions[UPLOAD_TOKEN_MANAGER_KEY] = upload_manager

    audit_log = app.extensions.get("ancorashield.audit_log")
    if audit_log is None:
        raise RuntimeError("Initialize the AncoraShield audit log before API security.")

    api_security = ApiSecurity(
        token_manager=access_manager,
        audit_log=audit_log,
        rate_limiter=RateLimiter(max_requests=120, window_seconds=60),
        max_request_bytes=app.config.get("MAX_CONTENT_LENGTH", 1024 ** 3),
    )
    api_security.init_app(app)


def access_token_manager() -> SessionTokenManager:
    manager = current_app.extensions.get(ACCESS_TOKEN_MANAGER_KEY)
    if not isinstance(manager, SessionTokenManager):
        raise RuntimeError("The AncoraShield access token manager was not initialized.")
    return manager


def refresh_token_manager() -> SessionTokenManager:
    manager = current_app.extensions.get(REFRESH_TOKEN_MANAGER_KEY)
    if not isinstance(manager, SessionTokenManager):
        raise RuntimeError("The AncoraShield refresh token manager was not initialized.")
    return manager


def issue_access_token(user_id: int) -> str:
    return access_token_manager().issue(
        str(user_id),
        roles=("user",),
        claims={"token_type": "access"},
    )


def issue_refresh_token(user_id: int) -> str:
    return refresh_token_manager().issue(
        str(user_id),
        roles=("refresh",),
        claims={"token_type": "refresh"},
    )


def issue_upload_token(user_id: int, claims: dict[str, Any]) -> str:
    manager = current_app.extensions.get(UPLOAD_TOKEN_MANAGER_KEY)
    if not isinstance(manager, SessionTokenManager):
        raise RuntimeError("The AncoraShield upload token manager was not initialized.")
    return manager.issue(
        str(user_id),
        roles=("upload",),
        claims={**claims, "token_type": "upload"},
    )


def _is_public_path(path: str) -> bool:
    return path in PUBLIC_PATHS or path.startswith("/api/crm/public/")


def protect_private_routes(app: Flask) -> None:
    endpoints: set[str] = set()
    for rule in app.url_map.iter_rules():
        if rule.endpoint == "static" or _is_public_path(rule.rule):
            continue
        endpoints.add(rule.endpoint)

    for endpoint in endpoints:
        view = app.view_functions.get(endpoint)
        if view is not None:
            app.view_functions[endpoint] = secure_route(
                required_roles=("user",)
            )(view)


def request_origin_is_allowed() -> bool:
    origin = request.headers.get("Origin")
    allowed_origins: Iterable[str] = current_app.config.get("CORS_ORIGINS", ())
    return bool(origin and origin in allowed_origins)
