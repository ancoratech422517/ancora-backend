"""Exceções públicas da biblioteca."""


class AncoraShieldError(Exception):
    """Base para erros que podem ser tratados pela aplicação."""


class ConfigurationError(AncoraShieldError):
    """Configuração criptográfica inválida."""


class DecryptionError(AncoraShieldError):
    """Falha genérica e sem detalhes sensíveis ao descriptografar."""


class AccessDenied(AncoraShieldError):
    """A operação solicitada não foi autorizada."""


class PasswordHashError(AncoraShieldError):
    """Hash de senha inválido ou impossível de verificar."""


class AuditIntegrityError(AncoraShieldError):
    """O log de auditoria está inválido ou foi alterado."""


class AuthenticationError(AncoraShieldError):
    """Token ausente, inválido, expirado ou adulterado."""


class RateLimitStoreFull(AncoraShieldError):
    """O limitador local atingiu o limite seguro de clientes acompanhados."""
