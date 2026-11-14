"""Hash de senhas com Argon2id via argon2-cffi."""

from __future__ import annotations

from argon2 import PasswordHasher as _Argon2PasswordHasher
from argon2.exceptions import (
    HashingError,
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)
from argon2.low_level import Type

from ancorashield.exceptions import PasswordHashError


class PasswordHasher:
    """Usa os parâmetros seguros padrão do argon2-cffi para Argon2id."""

    def __init__(self) -> None:
        self._hasher = _Argon2PasswordHasher(
            time_cost=3,
            memory_cost=64 * 1024,
            parallelism=4,
            hash_len=32,
            salt_len=16,
            type=Type.ID,
        )

    def hash(self, password: str) -> str:
        if not isinstance(password, str) or not password:
            raise ValueError("A senha deve ser uma string não vazia.")
        try:
            return self._hasher.hash(password)
        except HashingError:
            raise PasswordHashError("Não foi possível processar a senha.") from None

    def verify(self, password: str, encoded_hash: str) -> bool:
        if not isinstance(password, str) or not isinstance(encoded_hash, str):
            raise TypeError("Senha e hash devem ser strings.")
        try:
            return self._hasher.verify(encoded_hash, password)
        except VerifyMismatchError:
            return False
        except (InvalidHashError, VerificationError):
            raise PasswordHashError("Não foi possível verificar a senha.") from None

    def needs_rehash(self, encoded_hash: str) -> bool:
        try:
            return self._hasher.check_needs_rehash(encoded_hash)
        except (InvalidHashError, VerificationError):
            raise PasswordHashError("Hash de senha inválido.") from None
