"""Tokens de sessão assinados EdDSA e encapsulados em JWE."""

from __future__ import annotations

import secrets
import time
from collections.abc import Mapping, Sequence
from typing import Any

import jwt
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.asymmetric.rsa import (
    RSAPrivateKey,
    RSAPublicKey,
)
from jwcrypto import jwe, jwk
from jwcrypto.common import JWException

from ancorashield.exceptions import AuthenticationError, ConfigurationError


class SessionTokenManager:
    """Emite JWS EdDSA dentro de JWE RSA-OAEP-256/A256GCM."""

    def __init__(
        self,
        *,
        signing_key: Ed25519PrivateKey | None,
        verification_key: Ed25519PublicKey | None,
        encryption_key: jwk.JWK | None,
        decryption_key: jwk.JWK | None,
        issuer: str,
        audience: str,
        token_ttl_seconds: int = 900,
    ) -> None:
        if not issuer or not audience:
            raise ConfigurationError("issuer e audience são obrigatórios.")
        if token_ttl_seconds < 1:
            raise ConfigurationError("A validade do token deve ser positiva.")
        if signing_key is not None and not isinstance(signing_key, Ed25519PrivateKey):
            raise ConfigurationError("A chave de assinatura deve ser Ed25519 privada.")
        if verification_key is not None and not isinstance(
            verification_key, Ed25519PublicKey
        ):
            raise ConfigurationError("A chave de verificação deve ser Ed25519 pública.")
        if (signing_key is None) != (encryption_key is None):
            raise ConfigurationError(
                "Emissão exige ambas as chaves de assinatura e cifragem."
            )
        if (verification_key is None) != (decryption_key is None):
            raise ConfigurationError(
                "Validação exige ambas as chaves de verificação e decifragem."
            )
        if signing_key is None and verification_key is None:
            raise ConfigurationError("Configure chaves para emitir ou validar tokens.")

        if decryption_key is not None:
            if decryption_key.get("kty") != "RSA" or not decryption_key.has_private:
                raise ConfigurationError("A chave JWE de decifragem deve ser RSA privada.")
            decryption_rsa_key = decryption_key.get_op_key("decrypt")
            if (
                not isinstance(decryption_rsa_key, RSAPrivateKey)
                or decryption_rsa_key.key_size < 2048
            ):
                raise ConfigurationError("As chaves RSA devem ter no mínimo 2048 bits.")
        if encryption_key is not None:
            if encryption_key.get("kty") != "RSA" or encryption_key.has_private:
                raise ConfigurationError("A chave JWE de cifragem deve ser RSA pública.")
            encryption_rsa_key = encryption_key.get_op_key("encrypt")
            if (
                not isinstance(encryption_rsa_key, RSAPublicKey)
                or encryption_rsa_key.key_size < 2048
                or (
                    decryption_key is not None
                    and encryption_key.thumbprint() != decryption_key.thumbprint()
                )
            ):
                raise ConfigurationError(
                    "A chave RSA deve ter 2048 bits e corresponder à chave privada."
                )
        if signing_key is not None and verification_key is not None:
            if (
                signing_key.public_key().public_bytes(
                    serialization.Encoding.Raw, serialization.PublicFormat.Raw
                )
                != verification_key.public_bytes(
                    serialization.Encoding.Raw, serialization.PublicFormat.Raw
                )
            ):
                raise ConfigurationError("As chaves Ed25519 não formam um par.")
        self._signing_key = signing_key
        self._verification_key = verification_key
        self._encryption_key = encryption_key
        self._decryption_key = decryption_key
        self._issuer = issuer
        self._audience = audience
        self._token_ttl_seconds = token_ttl_seconds

    @classmethod
    def from_pem(
        cls,
        *,
        signing_private_pem: bytes | None = None,
        verification_public_pem: bytes | None = None,
        encryption_public_pem: bytes | None = None,
        decryption_private_pem: bytes | None = None,
        signing_private_password: bytes | None = None,
        decryption_private_password: bytes | None = None,
        issuer: str,
        audience: str,
        token_ttl_seconds: int = 900,
    ) -> SessionTokenManager:
        try:
            signing_key = (
                serialization.load_pem_private_key(
                    signing_private_pem, password=signing_private_password
                )
                if signing_private_pem is not None
                else None
            )
            verification_key = (
                serialization.load_pem_public_key(verification_public_pem)
                if verification_public_pem is not None
                else None
            )
            encryption_key = (
                jwk.JWK.from_pem(encryption_public_pem)
                if encryption_public_pem is not None
                else None
            )
            decryption_key = (
                jwk.JWK.from_pem(
                    decryption_private_pem,
                    password=decryption_private_password,
                )
                if decryption_private_pem is not None
                else None
            )
        except (ValueError, TypeError, UnsupportedAlgorithm, JWException):
            raise ConfigurationError(
                "Não foi possível carregar as chaves de sessão."
            ) from None
        if signing_key is not None and not isinstance(signing_key, Ed25519PrivateKey):
            raise ConfigurationError("A chave de assinatura deve ser Ed25519 privada.")
        if verification_key is not None and not isinstance(
            verification_key, Ed25519PublicKey
        ):
            raise ConfigurationError("A chave de verificação deve ser Ed25519 pública.")
        if (
            encryption_key is not None
            and decryption_key is not None
            and encryption_key.thumbprint() != decryption_key.thumbprint()
        ):
            raise ConfigurationError("As chaves JWE pública e privada não correspondem.")
        return cls(
            signing_key=signing_key,
            verification_key=verification_key,
            encryption_key=encryption_key,
            decryption_key=decryption_key,
            issuer=issuer,
            audience=audience,
            token_ttl_seconds=token_ttl_seconds,
        )

    def issue(
        self,
        subject: str,
        *,
        roles: Sequence[str] = (),
        claims: Mapping[str, Any] | None = None,
    ) -> str:
        """Emite token; claims extras não podem sobrescrever claims protegidas."""
        if self._signing_key is None or self._encryption_key is None:
            raise ConfigurationError(
                "Este gerenciador não tem chaves para emitir tokens."
            )
        if not isinstance(subject, str) or not subject:
            raise ValueError("subject deve ser uma string não vazia.")
        if isinstance(roles, str) or not isinstance(roles, Sequence) or any(
            not isinstance(role, str) or not role for role in roles
        ):
            raise ValueError("roles deve conter apenas nomes de papel válidos.")
        if claims is not None and not isinstance(claims, Mapping):
            raise TypeError("claims deve ser um mapeamento.")
        extra_claims = dict(claims or {})
        reserved = {"iss", "aud", "sub", "iat", "exp", "jti", "roles"}
        if reserved.intersection(extra_claims):
            raise ValueError("claims extras não podem substituir claims protegidas.")

        now = int(time.time())
        payload = {
            **extra_claims,
            "iss": self._issuer,
            "aud": self._audience,
            "sub": subject,
            "iat": now,
            "exp": now + self._token_ttl_seconds,
            "jti": secrets.token_urlsafe(24),
            "roles": list(dict.fromkeys(roles)),
        }
        signed = jwt.encode(
            payload,
            self._signing_key,
            algorithm="EdDSA",
            headers={"typ": "JWT"},
        )
        encrypted = jwe.JWE(
            plaintext=signed.encode("ascii"),
            protected={
                "alg": "RSA-OAEP-256",
                "enc": "A256GCM",
                "cty": "JWT",
                "kid": self._encryption_key.thumbprint(),
            },
        )
        encrypted.add_recipient(self._encryption_key)
        return encrypted.serialize(compact=True)

    def verify(self, token: str) -> dict[str, Any]:
        """Descriptografa e valida algoritmo, assinatura e claims temporais."""
        if self._verification_key is None or self._decryption_key is None:
            raise ConfigurationError(
                "Este gerenciador não tem chaves para validar tokens."
            )
        if not isinstance(token, str) or not token:
            raise AuthenticationError("Token de sessão inválido.")
        try:
            encrypted = jwe.JWE()
            encrypted.deserialize(token, key=self._decryption_key)
            header = encrypted.jose_header
            if header != {
                "alg": "RSA-OAEP-256",
                "enc": "A256GCM",
                "cty": "JWT",
                "kid": self._decryption_key.thumbprint(),
            }:
                raise ValueError
            signed = encrypted.payload.decode("ascii")
            claims = jwt.decode(
                signed,
                self._verification_key,
                algorithms=["EdDSA"],
                issuer=self._issuer,
                audience=self._audience,
                options={
                    "require": ["iss", "aud", "sub", "iat", "exp", "jti", "roles"]
                },
            )
            roles = claims.get("roles")
            if (
                not isinstance(claims.get("sub"), str)
                or not claims["sub"]
                or not isinstance(roles, list)
                or any(not isinstance(role, str) or not role for role in roles)
            ):
                raise ValueError
            return claims
        except (
            JWException,
            jwt.InvalidTokenError,
            UnicodeDecodeError,
            ValueError,
            TypeError,
        ):
            raise AuthenticationError("Token de sessão inválido.") from None
