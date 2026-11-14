import base64
import binascii
from pathlib import Path

from ancorashield import AuditLog, SigningKey
from flask import Flask, current_app


_AUDIT_EXTENSION_KEY = "ancorashield.audit_log"


def initialize_security_audit(app: Flask) -> None:
    encoded_key = app.config.get("ANCORASHIELD_AUDIT_SIGNING_KEY")
    if not isinstance(encoded_key, str) or not encoded_key:
        raise RuntimeError(
            "Configure ANCORASHIELD_AUDIT_SIGNING_KEY with a base64-encoded "
            "32-byte Ed25519 private key."
        )

    try:
        key_bytes = base64.b64decode(encoded_key, validate=True)
    except (binascii.Error, ValueError):
        raise RuntimeError(
            "ANCORASHIELD_AUDIT_SIGNING_KEY must be valid base64."
        ) from None

    signing_key = SigningKey.from_private_bytes(key_bytes)
    audit_path = app.config.get("ANCORASHIELD_AUDIT_LOG")
    if not isinstance(audit_path, (str, Path)) or not audit_path:
        raise RuntimeError("Configure ANCORASHIELD_AUDIT_LOG with a file path.")

    app.extensions[_AUDIT_EXTENSION_KEY] = AuditLog(audit_path, signing_key)


def record_security_event(event: str, details: dict[str, object]) -> None:
    audit_log = current_app.extensions.get(_AUDIT_EXTENSION_KEY)
    if audit_log is None:
        raise RuntimeError("The ancorashield audit log was not initialized.")
    audit_log.append(event, details)
