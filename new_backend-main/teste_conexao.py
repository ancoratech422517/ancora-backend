from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text

load_dotenv()

# Força uso do novo driver psycopg (Psycopg 3)
url = os.getenv("DATABASE_URL_MIGRATION") or os.getenv("DATABASE_URL")

if url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)

if "?" in url:
    url = url.split("?")[0]

print("🔗 Tentando conectar com psycopg...")

engine = create_engine(
    url,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 60,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
        "channel_binding": "disable"
    },
    pool_pre_ping=True
)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print("✅ CONEXÃO BEM SUCEDIDA!")
        print("PostgreSQL Version:", result.scalar())
except Exception as e:
    print("❌ Erro de conexão:", e)