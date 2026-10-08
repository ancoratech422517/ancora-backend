# run_migration.py
from dotenv import load_dotenv
import os
import sys

load_dotenv()

# Força psycopg2
os.environ["FLASK_ENV"] = "development"

from flask import Flask
from flask_migrate import Migrate
from sqlalchemy.pool import NullPool

from models.database import db

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL_MIGRATION") or os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    if "?" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?")[0]

    print("🚀 Usando URL para migração...")
    print(f"Host: {DATABASE_URL.split('@')[-1]}")

    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "poolclass": NullPool,
        "pool_pre_ping": True,
        "connect_args": {
            "sslmode": "require",
            "connect_timeout": 180,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    }
else:
    DATABASE_URL = "sqlite:///ecommerce.db"

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Importar modelos
from models.database import (
    Usuario, Amizade, Amigo, Menssagens, Registrar_produto,
    Pedidos_Produto, Tabel_Reacao_Produto, Sistema_Trafego_Pago,
    Carteira_Digital_Depositar, Cliente_vendedor
)

db.init_app(app)
migrate = Migrate(app, db)

if __name__ == "__main__":
    with app.app_context():
        from flask_migrate import upgrade, migrate as alembic_migrate, current
        
        print("🔍 Verificando estado atual...")
        current()
        
        print("\n🚀 Executando migração...")
        alembic_migrate(message="detectando as tabelas actuais")
        
        print("✅ Migração concluída!")