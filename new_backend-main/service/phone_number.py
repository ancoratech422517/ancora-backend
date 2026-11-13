import re


def normalizar_telefone(telefone):
    return re.sub(r"[^0-9]", "", str(telefone or ""))
