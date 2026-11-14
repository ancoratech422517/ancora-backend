import base64
from functools import lru_cache

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519, rsa

from service.security_audit import initialize_security_audit
from service.security_tokens import initialize_api_security


@lru_cache(maxsize=1)
def _token_key_settings():
    password = b"ancora-test-key-password"
    signing_key = ed25519.Ed25519PrivateKey.generate()
    encryption_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    return {
        "ANCORASHIELD_TOKEN_ISSUER": "https://test.ancora.local",
        "ANCORASHIELD_TOKEN_AUDIENCE": "ancora-test-api",
        "ANCORASHIELD_TOKEN_KEY_PASSWORD": password.decode("ascii"),
        "ANCORASHIELD_TOKEN_SIGNING_PRIVATE_PEM": base64.b64encode(
            signing_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.BestAvailableEncryption(password),
            )
        ).decode("ascii"),
        "ANCORASHIELD_TOKEN_VERIFY_PUBLIC_PEM": base64.b64encode(
            signing_key.public_key().public_bytes(
                serialization.Encoding.PEM,
                serialization.PublicFormat.SubjectPublicKeyInfo,
            )
        ).decode("ascii"),
        "ANCORASHIELD_TOKEN_ENCRYPT_PUBLIC_PEM": base64.b64encode(
            encryption_key.public_key().public_bytes(
                serialization.Encoding.PEM,
                serialization.PublicFormat.SubjectPublicKeyInfo,
            )
        ).decode("ascii"),
        "ANCORASHIELD_TOKEN_DECRYPT_PRIVATE_PEM": base64.b64encode(
            encryption_key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.BestAvailableEncryption(password),
            )
        ).decode("ascii"),
    }


def configure_test_security(app, audit_path):
    app.config.update(
        MAX_CONTENT_LENGTH=1024 ** 3,
        CORS_ORIGINS=["http://localhost:5173"],
        ANCORASHIELD_AUDIT_SIGNING_KEY=base64.b64encode(
            bytes(range(32))
        ).decode("ascii"),
        ANCORASHIELD_AUDIT_LOG=str(audit_path),
        **_token_key_settings(),
    )
    initialize_security_audit(app)
    initialize_api_security(app)
