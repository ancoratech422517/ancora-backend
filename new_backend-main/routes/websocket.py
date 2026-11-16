import os

from flask_socketio import SocketIO


CORS_ALLOWED_ORIGINS = [
    "capacitor://localhost",
    "https://ancora-oficial-ao.netlify.app",
    "https://ancora-ecommerc-tawny.vercel.app",
]
if os.environ.get("DEBUG", "False").strip().lower() in {"1", "true", "yes"}:
    CORS_ALLOWED_ORIGINS.extend([
        "http://localhost:5173",
        "http://127.0.0.1:5000",
        "http://192.168.11.1:5173",
        "http://10.140.176.115:5173",
    ])

socketio = SocketIO(
    logger=True,
    engineio_logger=True,
    async_mode="gevent",
    cors_allowed_origins=CORS_ALLOWED_ORIGINS,
)