"""Validação de formatos e codificação de saída."""

from __future__ import annotations

import html
import re
from collections.abc import Callable, Mapping
from typing import Any, TypeVar

T = TypeVar("T")
Validator = Callable[[Any], T]


class InputValidationError(ValueError):
    """Dados de entrada fora do esquema esperado."""


def validate_object(
    value: object,
    schema: Mapping[str, Validator[Any]],
    *,
    allow_extra: bool = False,
) -> dict[str, Any]:
    """Valida um objeto com todos os campos declarados obrigatórios."""
    if not isinstance(value, Mapping):
        raise InputValidationError("A entrada deve ser um objeto.")
    missing = set(schema) - set(value)
    extra = set(value) - set(schema)
    if missing or (extra and not allow_extra):
        raise InputValidationError("Os campos da entrada não correspondem ao esquema.")

    validated: dict[str, Any] = {}
    for name, validator in schema.items():
        try:
            validated[name] = validator(value[name])
        except (TypeError, ValueError) as exc:
            raise InputValidationError(f"Campo inválido: {name}.") from exc
    if allow_extra:
        validated.update({name: value[name] for name in extra})
    return validated


def string_field(*, max_length: int, min_length: int = 0) -> Validator[str]:
    if min_length < 0 or max_length < min_length:
        raise ValueError("Limites de tamanho inválidos.")

    def validate(value: Any) -> str:
        if (
            not isinstance(value, str)
            or len(value) < min_length
            or len(value) > max_length
        ):
            raise ValueError("String fora dos limites definidos.")
        return value

    return validate


def safe_string_field(
    *,
    max_length: int,
    min_length: int = 0,
    pattern: str | None = None,
) -> Validator[str]:
    """String limitada e opcionalmente allowlisted; não substitui proteção de sink."""
    base_validator = string_field(max_length=max_length, min_length=min_length)
    compiled_pattern = re.compile(pattern) if pattern is not None else None

    def validate(value: Any) -> str:
        result = base_validator(value)
        if any(ord(character) < 32 or ord(character) == 127 for character in result):
            raise ValueError("Caracteres de controle não são permitidos.")
        if compiled_pattern is not None and compiled_pattern.fullmatch(result) is None:
            raise ValueError("String fora do formato permitido.")
        return result

    return validate


def integer_field(*, minimum: int, maximum: int) -> Validator[int]:
    if maximum < minimum:
        raise ValueError("Limites numéricos inválidos.")

    def validate(value: Any) -> int:
        if isinstance(value, bool) or not isinstance(value, int):
            raise ValueError("O valor deve ser um inteiro.")
        if not minimum <= value <= maximum:
            raise ValueError("Inteiro fora dos limites definidos.")
        return value

    return validate


def escape_html(value: str) -> str:
    """Codifica texto não confiável para inserção em contexto HTML."""
    if not isinstance(value, str):
        raise TypeError("value deve ser uma string.")
    return html.escape(value, quote=True)
