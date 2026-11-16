from pathlib import PurePath


def upload_size(file_storage, max_bytes: int) -> int:
    """Return the size of a seekable upload, rejecting oversized or unknown streams."""
    if file_storage is None or max_bytes < 1:
        raise ValueError("Ficheiro inválido.")

    stream = file_storage.stream
    try:
        original_position = stream.tell()
        stream.seek(0, 2)
        size = stream.tell()
        stream.seek(original_position)
    except (AttributeError, OSError, ValueError):
        raise ValueError("Não foi possível validar o tamanho do ficheiro.") from None

    if size <= 0 or size > max_bytes:
        raise ValueError("O ficheiro excede o tamanho permitido.")
    return size


def validate_extension(file_storage, allowed_extensions: set[str]) -> str:
    filename = getattr(file_storage, "filename", "") or ""
    extension = PurePath(filename.replace("\\", "/")).suffix.lower().lstrip(".")
    if extension not in allowed_extensions:
        raise ValueError("Tipo de ficheiro não permitido.")
    return extension
