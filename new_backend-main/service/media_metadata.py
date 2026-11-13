BLURHASH_ALPHABET = frozenset(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~"
)


def validate_blurhash(value):
    if value is None or value == "":
        return None
    if (
        not isinstance(value, str)
        or not 6 <= len(value) <= 100
        or any(character not in BLURHASH_ALPHABET for character in value)
    ):
        raise ValueError("O BlurHash da mídia é inválido")
    return value
