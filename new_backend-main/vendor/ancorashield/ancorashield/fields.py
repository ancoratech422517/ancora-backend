"""Proteção explícita para campos sensíveis."""

from __future__ import annotations

from collections.abc import Callable, Mapping

from ancorashield.crypto import _AEADCipher
from ancorashield.exceptions import AccessDenied, DecryptionError

Authorizer = Callable[[object, str], bool]
AuditCallback = Callable[[str, Mapping[str, str]], None]


class SensitiveField:
    """Criptografa bytes e exige autorização antes de qualquer leitura."""

    def __init__(
        self,
        cipher: _AEADCipher,
        *,
        authorize: Authorizer,
        audit: AuditCallback,
    ) -> None:
        self._cipher = cipher
        self._authorize = authorize
        self._audit = audit

    def encrypt(self, plaintext: bytes, *, context: bytes) -> bytes:
        if not context:
            raise ValueError("context deve identificar o uso do campo.")
        self._audit("sensitive_field.write_attempt", {})
        return self._cipher.encrypt(plaintext, aad=context)

    def decrypt(
        self, envelope: bytes, *, principal: object, purpose: str, context: bytes
    ) -> bytes:
        if not purpose:
            raise ValueError("purpose deve descrever o motivo do acesso.")
        self._audit("sensitive_field.read_attempt", {"purpose": purpose})
        if not self._authorize(principal, purpose):
            self._audit("sensitive_field.read_denied", {"purpose": purpose})
            raise AccessDenied("Acesso ao campo sensível não autorizado.")
        self._audit("sensitive_field.read_authorized", {"purpose": purpose})
        try:
            plaintext = self._cipher.decrypt(envelope, aad=context)
        except DecryptionError:
            self._audit("sensitive_field.read_failed", {"purpose": purpose})
            raise
        self._audit("sensitive_field.read_succeeded", {"purpose": purpose})
        return plaintext
