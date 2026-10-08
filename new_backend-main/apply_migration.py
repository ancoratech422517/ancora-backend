# apply_migration.py
from dotenv import load_dotenv
import os
import time

load_dotenv()

from flask import Flask
from flask_migrate import Migrate, upgrade
from sqlalchemy.pool import NullPool

from models.database import db

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL_MIGRATION") or os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

    print("🚀 Tentando aplicar migração no Neon...")

    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "poolclass": NullPool,
        "pool_pre_ping": True,
        "connect_args": {
            "sslmode": "require",
            "connect_timeout": 180,        # 3 minutos
            "keepalives": 1,
            "keepalives_idle": 60,
            "keepalives_interval": 10,
            "keepalives_count": 5,
            "channel_binding": "disable"
        }
    }
else:
    DATABASE_URL = "sqlite:///ecommerce.db"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

if __name__ == "__main__":
    print("⏳ Aguardando 15 segundos para o Neon acordar...")
    time.sleep(15)
    
    with app.app_context():
        print("🚀 Aplicando migração...")
        upgrade()
        print("✅ Migração aplicada com sucesso!")