# manage_db.py
from dotenv import load_dotenv
import os

load_dotenv()

os.environ["FLASK_ENV"] = "development"

from flask import Flask
from flask_migrate import Migrate
from sqlalchemy.pool import NullPool

from models.database import db

app = Flask(__name__)

# ===================== CONFIGURAÇÃO NEON =====================
DATABASE_URL = os.getenv("DATABASE_URL_MIGRATION") or os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

    print("\n" + "="*90)
    print("🚀 CONEXÃO COM NEON (Scale-to-Zero)")
    print(f"📍 Host: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print("="*90 + "\n")

    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "poolclass": NullPool,
        "pool_pre_ping": True,
        "connect_args": {
            "sslmode": "require",
            "connect_timeout": 120,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "channel_binding": "disable"
        }
    }
else:
    DATABASE_URL = "sqlite:///ecommerce.db"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ===================== IMPORTAÇÃO DOS MODELOS =====================
from models.database import (
    Usuario, Amizade, Amigo, Menssagens, Registrar_produto,
    Pedidos_Produto, Tabel_Reacao_Produto, Sistema_Trafego_Pago,
    Carteira_Digital_Depositar, Cliente_vendedor
)

db.init_app(app)
migrate = Migrate(app, db)

if __name__ == "__main__":
    print("⚡ Gerenciador de Banco de Dados Ativo")