import hashlib
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
from gevent import monkey
monkey.patch_all()
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text
from ancorashield.auth.rate_limit import RateLimiter
from models.database import db
from service.database_schema import ensure_columns
from service.referral_codes import ensure_referral_schema
from service.security_audit import initialize_security_audit
from service.security_tokens import initialize_api_security, protect_private_routes
from service.lifecycle_cleanup import iniciar_limpeza_periodica
from flask_talisman import Talisman
from flask_migrate import Migrate
import cloudinary
import cloudinary.uploader
# ===================== CLOUDINARY =====================
# ===================== CLOUDINARY - FIX AGRESSIVO =====================
import sys
sys.setrecursionlimit(30000)

import cloudinary
from urllib3 import HTTPSConnectionPool
from urllib3.connectionpool import HTTPConnectionPool

# Configuração
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# FIX AGRESSIVO - Substitui completamente as classes problemáticas
try:
    import cloudinary.api_client.tcp_keep_alive_manager as keep_alive_module
    
    # Substitui tanto o TCP quanto o HTTP pool
    keep_alive_module.TCPKeepAliveHTTPSConnectionPool = HTTPSConnectionPool
    keep_alive_module.TCPKeepAliveHTTPConnectionPool = HTTPConnectionPool   # por segurança
    
    # Também força no nível do módulo
    cloudinary.api_client.tcp_keep_alive_manager.TCPKeepAliveHTTPSConnectionPool = HTTPSConnectionPool
    
    print("✅ TCP Keep Alive substituído completamente pelo pool padrão do urllib3")
    
except Exception as e:
    print(f"⚠️ Erro ao aplicar patch: {e}")

cloudinary.uploader.SECURE = True
print("✅ Cloudinary configurado (HTTPS forçado)")


PORT = int(os.environ.get("PORT", 5000))
DEBUG = os.environ.get("DEBUG", "False").strip().lower() in {"1", "true", "yes"}
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must contain at least 32 characters.")

from routes.websocket import socketio

# Importação dos Blueprints
from routes.api_register import registrar
from routes.api_auth import login_bp
from routes.api_usuario import users_bp
from routes.api_get_date_perfil import date_perfil_user
from routes.websocket_notificacao import notificacao
from routes.api_nitificacao_visualizada import notificacao_visualizada
from routes.api_meus_amigos import meus_amigos
from routes.api_get_quantidade_menssagem import quantidade_menssagem
from routes.api_registrar_produto import registrar_produto
from routes.api_buscar_produtos_usuario import buscar_produto_Usuario
from routes.api_upload_file import upload_bp
from routes.api_crm import crm_bp
from routes.api_academy import academy_bp
from routes.api_assistente_ia import assistant_bp
from routes.api_social import social_bp
from routes.api_todos_produtos import Todos_produtos
from routes.api_dashboard_loja import dashboard_loja
from routes.api_me import login_bp as me_bp
from routes.api_logout import login_bp as logout_bp
from routes.api_ComprarProduto import ComprarProduto
from routes.api_buscar_pedidos_produtos import buscar_pedidos
from routes.api_actualizar_foto_perfil import Actualizar_foto_perfil
from routes.api_Deletar_Notificacao_usuario import Deletar_notificacao
from routes.api_visto_usuario import visto_usuario
from routes.api_sistema_adoro_ancora import sistema_adoro_Ancora
from routes.api_send_dados_trafego import Send_trafego_dados
from routes.api_Depositar_Dinheiro import Depositar_Dinheiro
from routes.api_menssage_http import messages_http_bp
from routes.api_salvar_push_token import PushTokenAPI
#--------------------------------------------------------------
from routes.api_validar_registro_turma import api_validar_registro_turma
from routes.api_buscar_turma_usuario import turma_usuario
from routes.api_buscar_aluno_turma import Buscar_Aluno_Turma
from routes.api_convidar_usuario_turma import Convidae_Usuario_Turma
from routes.api_aceitar_convite_turma import Aceitar_Convite_Turma
from routes.api_recusar_convite_turma import Recusar_Convite_Turma
from routes.api_ancora_live import Ancora_Live
from routes.api_agendar_live_turma import AgendarLiveTurma
from routes.api_buscar_agenda_turma import Buscar_Agenda_Turma
from routes.api_adicionar_nova_aula import adicionar_nova_aula
from routes.api_buscar_video_turma import Buscar_Video_Turma
from routes.api_buscar_dados_perfil_usuario import Buscar_Dados_Perfil_Usuario
from routes.api_buscar_dados_estado import DadosEstado
from routes.api_adicionar_estado_musica import EstadoMusicaUsuario
from routes.api_adicionar_estado_imgem import EstadoImagem
from routes.api_enviar_video_estado import EstadoVideo
from routes.api_buscar_dados_perfil_usuario_add import GetDateUserAdd
from routes.api_estado_meu_amigo import EstadoMeuAmigo
from routes.api_mensagem_privado_autentificacao import api_mensagem_privado_autentificacao
from routes.api_trancar_conversa import TrancarConversa
from routes.api_bloquear_amigo import Bloquear_Usuario
from routes.api_exluir_amigo import Excluir_amigo
#----------------------------------------------------------------------------------------------
import routes.websoket_conectUser
import routes.websocket_aceitar_pedido_amizade
import routes.websocket_recusar_pedido_amizade
import routes.websocket_entrar_na_sala
import routes.websocket_enviar_menssagem
import routes.websocket_usuario_digitando
import routes.websocket_buscar_menssagens
import routes.websocket_sair_da_sala
import routes.websoket_menssagem_visualizada
import routes.websocket_nova_quantidade_de_menssagem
import routes.websocket_Eliminar_menssagem
import routes.websocket_Editar_menssagem
import routes.websocket_notificar_compra_usuario
#--------------------------------------------------
import routes.websocket_convidar_usuario_turma
import routes.websocket_buscar_nova_aula
import routes.websocket_buscar_agenda_turma
import routes.websocket_chamada_grupo
import routes.websoket_Adicionar_Nova_Descricao
import routes.websocket_Solicitar_entrada_grupo
import routes.websocket_notificar_usuario_solicirante


app = Flask(__name__)

# ===================== CORS =====================
CORS_ORIGINS = [
    "capacitor://localhost",
    "https://ancora-oficial-ao.netlify.app",
    "https://ancora-ecommerc-tawny.vercel.app",
]
if DEBUG:
    CORS_ORIGINS.extend([
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://localhost",
        "http://localhost",
        "http://192.168.11.1",
        "http://192.168.11.1:5173",
        "http://10.140.176.115:5173",
    ])
CORS(app, resources={r"/*": {
    "origins": CORS_ORIGINS,
    "supports_credentials": True,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

app.config["CORS_ORIGINS"] = CORS_ORIGINS

auth_rate_limiter = RateLimiter(max_requests=10, window_seconds=300)


@app.before_request
def limit_authentication_attempts():
    # Em produção, vários utilizadores podem chegar ao Flask pelo mesmo proxy.
    # Limitar pelo remote_addr bloqueava todos depois de 10 logins/refreshes.
    # O limite de login deve ser isolado por conta; refresh tem rotação de token.
    if request.method != "POST" or request.path.casefold() != "/login":
        return None
    payload = request.get_json(silent=True)
    telefone = payload.get("telefone") if isinstance(payload, dict) else None
    telefone = (
        "".join(character for character in telefone if character in "0123456789")
        if isinstance(telefone, str)
        else ""
    )
    if telefone:
        rate_limit_identity = f"account:{telefone}"
    else:
        rate_limit_identity = f"invalid:{request.remote_addr or 'unknown'}"
    client_key = hashlib.sha256(rate_limit_identity.encode("utf-8")).hexdigest()
    allowed, retry_after = auth_rate_limiter.check(client_key)
    if allowed:
        return None
    response = jsonify(error="too many authentication requests", retry_after=retry_after)
    response.status_code = 429
    response.headers["Retry-After"] = str(retry_after)
    return response


@app.before_request
def handle_cors_preflight():
    if request.method == "OPTIONS":
        return app.make_default_options_response()
    return None


@app.after_request
def prevent_dynamic_response_caching(response):
    if request.endpoint != "static":
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
# teste

# ===================== CLOUDINARY =====================

# ===================== TALISMAN =====================
Talisman(app,
    content_security_policy={
        'default-src': "'self'",
        'img-src': ["'self'", "data:", "blob:", "*.cloudinary.com", "https://upload.wikimedia.org"],
        'media-src': ["'self'", "blob:", "*.cloudinary.com"]
    },
    force_https=False,
    strict_transport_security=not DEBUG
)

# ===================== BASE DE DADOS (NEON) =====================
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
            "pool_timeout": 30,
            "connect_args": {
                "connect_timeout": 20,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
            }
        }

    print("🔗 Usando Neon (PostgreSQL)")
else:
    if not DEBUG:
        raise RuntimeError("DATABASE_URL must be configured outside DEBUG mode.")
    DATABASE_URL = "sqlite:///ecommerce.db"
    print("⚠️ DATABASE_URL não encontrada → Usando SQLite local")

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY
app.config['FRONTEND_URL'] = os.getenv('FRONTEND_URL') or 'https://ancora-ecommerc-tawny.vercel.app'
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'files')
app.config['MAX_CONTENT_LENGTH'] = 128 * 1024 * 1024
app.config['ANCORASHIELD_AUDIT_SIGNING_KEY'] = os.getenv(
    'ANCORASHIELD_AUDIT_SIGNING_KEY'
)
app.config['ANCORASHIELD_AUDIT_LOG'] = os.getenv(
    'ANCORASHIELD_AUDIT_LOG',
    os.path.join(app.instance_path, 'security-audit.jsonl'),
)
app.config['ANCORASHIELD_TOKEN_ISSUER'] = os.getenv(
    'ANCORASHIELD_TOKEN_ISSUER'
)
app.config['ANCORASHIELD_TOKEN_AUDIENCE'] = os.getenv(
    'ANCORASHIELD_TOKEN_AUDIENCE'
)
app.config['ANCORASHIELD_TOKEN_KEY_PASSWORD'] = os.getenv(
    'ANCORASHIELD_TOKEN_KEY_PASSWORD'
)
for token_key_setting in (
    'ANCORASHIELD_TOKEN_SIGNING_PRIVATE_PEM',
    'ANCORASHIELD_TOKEN_VERIFY_PUBLIC_PEM',
    'ANCORASHIELD_TOKEN_ENCRYPT_PUBLIC_PEM',
    'ANCORASHIELD_TOKEN_DECRYPT_PRIVATE_PEM',
):
    app.config[token_key_setting] = os.getenv(token_key_setting)

initialize_security_audit(app)
initialize_api_security(app)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)
migrate = Migrate(app, db)
socketio.init_app(app)

def setup_database():
    with app.app_context():
        try:
            db.create_all()

            colunas_anexo = {
                "file_url": "TEXT",
                "public_id": "TEXT",
                "file_name": "TEXT",
                "mime_type": "TEXT",
                "file_size": "INTEGER",
                "client_message_id": "VARCHAR(80)",
            }
            ensure_columns(db.engine, "menssagens", colunas_anexo)
            with db.engine.begin() as connection:
                connection.execute(text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS "
                    "ix_menssagens_client_message_id "
                    "ON menssagens (client_message_id)"
                ))
            ensure_columns(db.engine, "usuarios", {
                "foto_usuario_blurhash": "VARCHAR(100)",
                "id_app_usuario_pushy": "TEXT",
            })
            ensure_referral_schema(db.engine)
            ensure_columns(db.engine, "Produto_usuario", {
                "image_source_url": "TEXT",
                "image_creator": "VARCHAR(200)",
                "image_license": "VARCHAR(120)",
            })
            ensure_columns(db.engine, "Agendar_Live_Turma", {
                "live_vazia_em": "TIMESTAMP",
            })
            ensure_columns(db.engine, "Dados_Estado", {
                "criado_em": "TIMESTAMP",
            })
            with db.engine.begin() as connection:
                connection.execute(text(
                    'UPDATE "Dados_Estado" '
                    "SET criado_em = CURRENT_TIMESTAMP WHERE criado_em IS NULL"
                ))

            print("✅ Banco de dados inicializado com sucesso!")
        except Exception as e:
            print(f"❌ Erro ao inicializar banco: {e}")
            raise

# Executa a inicialização do banco fora do __main__ para funcionar no deploy
setup_database()

# ===================== REGISTO DOS BLUEPRINTS =====================
app.register_blueprint(registrar)
app.register_blueprint(users_bp)
app.register_blueprint(date_perfil_user)
app.register_blueprint(notificacao)
app.register_blueprint(notificacao_visualizada)
app.register_blueprint(meus_amigos)
app.register_blueprint(quantidade_menssagem)
app.register_blueprint(registrar_produto)
app.register_blueprint(buscar_produto_Usuario)
app.register_blueprint(upload_bp)
app.register_blueprint(crm_bp)
app.register_blueprint(academy_bp)
app.register_blueprint(assistant_bp)
app.register_blueprint(social_bp)
app.register_blueprint(Todos_produtos)
app.register_blueprint(dashboard_loja)
app.register_blueprint(me_bp)
app.register_blueprint(ComprarProduto)
app.register_blueprint(buscar_pedidos)
app.register_blueprint(Actualizar_foto_perfil)
app.register_blueprint(Deletar_notificacao)
app.register_blueprint(visto_usuario)
app.register_blueprint(sistema_adoro_Ancora)
app.register_blueprint(Send_trafego_dados)
app.register_blueprint(Depositar_Dinheiro)
app.register_blueprint(messages_http_bp)
app.register_blueprint(PushTokenAPI)
app.register_blueprint(api_validar_registro_turma)
app.register_blueprint(turma_usuario)
app.register_blueprint(Buscar_Aluno_Turma)
app.register_blueprint(Convidae_Usuario_Turma)
app.register_blueprint(Aceitar_Convite_Turma)
app.register_blueprint(Recusar_Convite_Turma)
app.register_blueprint(Ancora_Live)
app.register_blueprint(AgendarLiveTurma)
app.register_blueprint(Buscar_Agenda_Turma)
app.register_blueprint(adicionar_nova_aula)
app.register_blueprint(Buscar_Video_Turma)
app.register_blueprint(Buscar_Dados_Perfil_Usuario)
app.register_blueprint(DadosEstado)
app.register_blueprint(EstadoMusicaUsuario)
app.register_blueprint(EstadoImagem)
app.register_blueprint(EstadoVideo)
app.register_blueprint(GetDateUserAdd)
app.register_blueprint(EstadoMeuAmigo)
app.register_blueprint(api_mensagem_privado_autentificacao)
app.register_blueprint(TrancarConversa)
app.register_blueprint(Bloquear_Usuario)
app.register_blueprint(Excluir_amigo)
protect_private_routes(app)


@app.before_request
def iniciar_limpeza_de_expiracao():
    iniciar_limpeza_periodica(app)

if __name__ == '__main__':
    print("=" * 70)
    print("🚀 Servidor Flask + SocketIO iniciado!")
    print(f"🌍 Porta: {PORT} | Debug: {DEBUG}")
    print(f"🔗 Banco: Neon (PostgreSQL)")
    print("=" * 70)

    socketio.run(app, host="0.0.0.0", port=PORT, debug=DEBUG, allow_unsafe_werkzeug=DEBUG)
