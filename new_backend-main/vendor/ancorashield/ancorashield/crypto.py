"""Criptografia autenticada e assinaturas digitais."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import TypeAlias

from cryptography.exceptions import InvalidSignature, InvalidTag, UnsupportedAlgorithm
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.ciphers.aead import (
    AESGCM,
    ChaCha20Poly1305,
)

from ancorashield.exceptions import ConfigurationError, DecryptionError

_NONCE_LENGTH = 12
_ENVELOPE_PREFIX = b"AS\x01"
_CIPHER_TYPES: TypeAlias = type[AESGCM] | type[ChaCha20Poly1305]


class _AEADCipher:
    """Envelope versionado com nonce aleatório e autenticação AEAD."""

    algorithm_id: bytes
    _cipher_type: _CIPHER_TYPES

    def __init__(self, key: bytes) -> None:
        if not isinstance(key, bytes) or len(key) != 32:
            raise ConfigurationError("A chave deve conter exatamente 32 bytes.")
        self._cipher = self._cipher_type(key)

    @classmethod
    def generate_key(cls) -> bytes:
        """Gera uma chave independente para armazenar em um KMS/secret manager."""
        return os.urandom(32)

    def encrypt(self, plaintext: bytes, *, aad: bytes | None = None) -> bytes:
        if not isinstance(plaintext, bytes):
            raise TypeError("plaintext deve ser bytes.")
        if aad is not None and not isinstance(aad, bytes):
            raise TypeError("aad deve ser bytes ou None.")

        nonce = os.urandom(_NONCE_LENGTH)
        ciphertext = self._cipher.encrypt(nonce, plaintext, aad)
        return _ENVELOPE_PREFIX + self.algorithm_id + nonce + ciphertext

    def decrypt(self, envelope: bytes, *, aad: bytes | None = None) -> bytes:
        if not isinstance(envelope, bytes):
            raise TypeError("envelope deve ser bytes.")
        if aad is not None and not isinstance(aad, bytes):
            raise TypeError("aad deve ser bytes ou None.")
        minimum_length = len(_ENVELOPE_PREFIX) + 1 + _NONCE_LENGTH + 16
        if (
            len(envelope) < minimum_length
            or not envelope.startswith(_ENVELOPE_PREFIX + self.algorithm_id)
        ):
            raise DecryptionError("Não foi possível descriptografar os dados.")

        nonce_start = len(_ENVELOPE_PREFIX) + 1
        nonce = envelope[nonce_start : nonce_start + _NONCE_LENGTH]
        ciphertext = envelope[nonce_start + _NONCE_LENGTH :]
        try:
            return self._cipher.decrypt(nonce, ciphertext, aad)
        except InvalidTag:
            raise DecryptionError(
                "Não foi possível descriptografar os dados."
            ) from None


class AESGCMCipher(_AEADCipher):
    """AES-256-GCM; gera nonce aleatório de 96 bits por mensagem."""

    algorithm_id = b"A"
    _cipher_type = AESGCM


class ChaCha20Poly1305Cipher(_AEADCipher):
    """ChaCha20-Poly1305; gera nonce aleatório de 96 bits por mensagem."""

    algorithm_id = b"C"
    _cipher_type = ChaCha20Poly1305


@dataclass(frozen=True)
class SigningKey:
    """Chave Ed25519 para assinatura e verificação de integridade."""

    _private_key: Ed25519PrivateKey

    @classmethod
    def generate(cls) -> SigningKey:
        return cls(Ed25519PrivateKey.generate())

    @classmethod
    def from_private_bytes(cls, private_bytes: bytes) -> SigningKey:
        if len(private_bytes) != 32:
            raise ConfigurationError("A chave privada Ed25519 deve ter 32 bytes.")
        return cls(Ed25519PrivateKey.from_private_bytes(private_bytes))

    @classmethod
    def from_pem(cls, private_pem: bytes, *, password: bytes) -> SigningKey:
        try:
            private_key = serialization.load_pem_private_key(
                private_pem, password=password
            )
        except (TypeError, ValueError, UnsupportedAlgorithm):
            raise ConfigurationError(
                "Não foi possível carregar a chave privada Ed25519."
            ) from None
        if not isinstance(private_key, Ed25519PrivateKey):
            raise ConfigurationError("A chave PEM não é Ed25519.")
        return cls(private_key)

    def private_bytes(self, *, password: bytes) -> bytes:
        """Exporta chave em PEM criptografado; nunca persista PEM sem proteção."""
        if not password:
            raise ConfigurationError("A senha de proteção não pode ser vazia.")
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(password),
        )

    def sign(self, message: bytes) -> bytes:
        return self._private_key.sign(message)

    def public_key(self) -> Ed25519PublicKey:
        return self._private_key.public_key()

    @staticmethod
    def verify(
        public_key: Ed25519PublicKey, message: bytes, signature: bytes
    ) -> bool:
        try:
            public_key.verify(signature, message)
            return True
        except InvalidSignature:
            return False
