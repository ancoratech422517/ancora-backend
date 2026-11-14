"""Log encadeado e assinado para evidência de adulteração."""

from __future__ import annotations

import base64
import binascii
import hashlib
import json
import os
import threading
from collections.abc import Mapping
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from ancorashield.crypto import SigningKey
from ancorashield.exceptions import AuditIntegrityError

_GENESIS = "0" * 64


def _canonical_json(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


class AuditLog:
    """Ledger JSONL local. Assinaturas detectam alterações; não impedem exclusão."""

    def __init__(self, path: str | Path, signing_key: SigningKey) -> None:
        self._path = Path(path)
        self._signing_key = signing_key
        self._lock = threading.Lock()

    @property
    def public_key(self) -> Ed25519PublicKey:
        return self._signing_key.public_key()

    def append(self, event: str, details: Mapping[str, Any]) -> str:
        if not event or not isinstance(event, str):
            raise ValueError("event deve ser uma string não vazia.")
        if not isinstance(details, Mapping):
            raise TypeError("details deve ser um mapeamento.")

        with self._lock:
            records = self._read_records()
            previous_hash = self._verify_records(records, self.public_key)
            payload = {
                "sequence": len(records) + 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": event,
                "details": dict(details),
                "previous_hash": previous_hash,
            }
            digest = hashlib.sha256(_canonical_json(payload)).hexdigest()
            record = {
                **payload,
                "hash": digest,
                "signature": base64.b64encode(
                    self._signing_key.sign(bytes.fromhex(digest))
                ).decode("ascii"),
            }
            line = _canonical_json(record) + b"\n"
            self._path.parent.mkdir(parents=True, exist_ok=True)
            try:
                with self._path.open("ab") as audit_file:
                    audit_file.write(line)
                    audit_file.flush()
                    os.fsync(audit_file.fileno())
            except OSError:
                raise AuditIntegrityError("Falha ao persistir o log de auditoria.") from None
            return digest

    def verify(self) -> bool:
        with self._lock:
            records = self._read_records()
            self._verify_records(records, self.public_key)
            return True

    def _read_records(self) -> list[dict[str, Any]]:
        if not self._path.exists():
            return []
        try:
            lines = self._path.read_bytes().splitlines()
            records = [json.loads(line) for line in lines]
            if any(not isinstance(record, dict) for record in records):
                raise ValueError
            return records
        except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
            raise AuditIntegrityError("O log de auditoria está inválido.") from None

    @staticmethod
    def _verify_records(
        records: list[dict[str, Any]], public_key: Ed25519PublicKey
    ) -> str:
        expected_previous = _GENESIS
        for sequence, record in enumerate(records, start=1):
            try:
                payload = {
                    "sequence": record["sequence"],
                    "timestamp": record["timestamp"],
                    "event": record["event"],
                    "details": record["details"],
                    "previous_hash": record["previous_hash"],
                }
                digest = hashlib.sha256(_canonical_json(payload)).hexdigest()
                if (
                    record["sequence"] != sequence
                    or record["previous_hash"] != expected_previous
                    or record["hash"] != digest
                ):
                    raise ValueError
                signature = base64.b64decode(record["signature"], validate=True)
                public_key.verify(signature, bytes.fromhex(digest))
                expected_previous = digest
            except (KeyError, TypeError, ValueError, binascii.Error, InvalidSignature):
                raise AuditIntegrityError(
                    "A integridade do log de auditoria falhou."
                ) from None
        return expected_previous
