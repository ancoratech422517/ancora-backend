"""Rate limiter local de janela deslizante para defesa básica de API."""

from __future__ import annotations

import math
import threading
import time
from collections import deque
from collections.abc import Callable


class RateLimiter:
    """Limitador por chave, com memória limitada e sincronização entre threads.

    O estado é local ao processo; implantação multiworker requer backend
    compartilhado, como Redis, com operações atômicas.
    """

    def __init__(
        self,
        *,
        max_requests: int,
        window_seconds: float,
        max_clients: int = 10_000,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_requests < 1 or window_seconds <= 0 or max_clients < 1:
            raise ValueError("Configuração de rate limit inválida.")
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._max_clients = max_clients
        self._clock = clock
        self._requests: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int]:
        """Retorna (permitido, Retry-After em segundos)."""
        if not isinstance(key, str) or not key:
            raise ValueError("A chave do rate limiter deve ser não vazia.")
        now = self._clock()
        with self._lock:
            timestamps = self._requests.get(key)
            if timestamps is None:
                self._prune_expired(now)
                if len(self._requests) >= self._max_clients:
                    return False, max(1, math.ceil(self._window_seconds))
                timestamps = deque()
                self._requests[key] = timestamps

            cutoff = now - self._window_seconds
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) >= self._max_requests:
                retry_after = math.ceil(
                    self._window_seconds - (now - timestamps[0])
                )
                return False, max(1, retry_after)

            timestamps.append(now)
            return True, 0

    def _prune_expired(self, now: float) -> None:
        cutoff = now - self._window_seconds
        expired = [
            key
            for key, timestamps in self._requests.items()
            if not timestamps or timestamps[-1] <= cutoff
        ]
        for key in expired:
            del self._requests[key]
