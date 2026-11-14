"""Tipos SQLAlchemy que criptografam automaticamente valores em repouso.

Instale a integração com ``ancorashield[database]``.
"""

from __future__ import annotations

from sqlalchemy.types import LargeBinary, TypeDecorator

from ancorashield.crypto import _AEADCipher


class EncryptedBytes(TypeDecorator[bytes]):
    """Armazena bytes cifrados e os decifra ao materializar a coluna."""

    impl = LargeBinary
    cache_ok = True

    def __init__(
        self, cipher: _AEADCipher, *, context: str, **kwargs: object
    ) -> None:
        if not context:
            raise ValueError("context deve identificar tabela e coluna.")
        self._cipher = cipher
        self._context = context.encode("utf-8")
        super().__init__(**kwargs)

    def process_bind_param(self, value: bytes | None, dialect: object) -> bytes | None:
        if value is None:
            return None
        if not isinstance(value, bytes):
            raise TypeError("EncryptedBytes aceita apenas bytes ou None.")
        return self._cipher.encrypt(value, aad=self._context)

    def process_result_value(
        self, value: bytes | None, dialect: object
    ) -> bytes | None:
        if value is None:
            return None
        return self._cipher.decrypt(value, aad=self._context)


class EncryptedText(TypeDecorator[str]):
    """Armazena texto UTF-8 cifrado em BYTEA/BLOB e decifra ao ler."""

    impl = LargeBinary
    cache_ok = True

    def __init__(
        self, cipher: _AEADCipher, *, context: str, **kwargs: object
    ) -> None:
        if not context:
            raise ValueError("context deve identificar tabela e coluna.")
        self._cipher = cipher
        self._context = context.encode("utf-8")
        super().__init__(**kwargs)

    def process_bind_param(self, value: str | None, dialect: object) -> bytes | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise TypeError("EncryptedText aceita apenas strings ou None.")
        return self._cipher.encrypt(value.encode("utf-8"), aad=self._context)

    def process_result_value(
        self, value: bytes | None, dialect: object
    ) -> str | None:
        if value is None:
            return None
        return self._cipher.decrypt(value, aad=self._context).decode("utf-8")
