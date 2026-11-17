from models.database import Usuario , db
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from sqlalchemy.exc import IntegrityError
import logging
from service.password_security import hash_password
from service.referral_codes import gerar_codigo_convite

logger = logging.getLogger(__name__)


def _is_duplicate_phone_error(error):
    original_error = getattr(error, "orig", error)
    message = str(original_error).lower()
    if "usuarios.telefone" in message or "usuarios_telefone" in message:
        return True
    constraint_name = getattr(getattr(original_error, "diag", None), "constraint_name", "")
    return "telefone" in str(constraint_name).lower()


class RegisterService:
    def registrar_user_in_db(self, nome, telefone, senha , email , data_nascimento , foto_usuario , foto_usuario_blurhash=None , continente=None , pais=None , provincia=None , capital=None , bairro=None, codigo_convite=None):

        if not isinstance(telefone, str) or not telefone or len(telefone) > 20:
            return {"erro": "O telefone é inválido."}, 400
        if Usuario.query.filter_by(telefone=telefone).first():
            return {
                "erro": "Este telefone já tem uma conta. Inicie sessão ou use outro número."
            }, 409

        convidado_por_id = None
        if codigo_convite:
            codigo_convite = str(codigo_convite).strip().upper()
            if len(codigo_convite) > 16 or not codigo_convite.isalnum():
                return {"erro": "O código de convite é inválido."}, 400
            convidador = Usuario.query.filter_by(codigo_convite=codigo_convite).first()
            if not convidador:
                return {"erro": "Este código de convite não existe."}, 400
            convidado_por_id = convidador.id

        # 2. Gerar o Par de Chaves Assimétricas (Para Saques/Pagamentos)
        # O RSA de 2048 bits é o padrão de segurança atual
        chave_privada_obj = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )

        # Converter Chave Privada para texto (PEM) - O usuário deve guardar isso!
        private_pem = chave_privada_obj.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        # Converter Chave Pública para texto (PEM) - Isso vai para o BANCO
        public_pem = chave_privada_obj.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

        # 3. Criar o Hash da Senha (Criptografia Simétrica de via única)
        senha_protegida = hash_password(senha)
        codigo_usuario = gerar_codigo_convite()
        while Usuario.query.filter_by(codigo_convite=codigo_usuario).first():
            codigo_usuario = gerar_codigo_convite()

        # 4. Salvar no SQLAlchemy
        try:
            novo_usuario = Usuario(
                nome=nome,
                telefone=telefone,
                senha_hash=senha_protegida,
                chave_publica=public_pem, # Guardamos a pública para validar saques
                foto_usuario = foto_usuario or "none",
                foto_usuario_blurhash = foto_usuario_blurhash,
                email = email,
                data_nascimento = data_nascimento , 
                continente = continente,
                pais = pais,
                provincia = provincia,
                capital = capital,
                bairro = bairro,
                codigo_convite=codigo_usuario,
                convidado_por_id=convidado_por_id,
            )
            
            db.session.add(novo_usuario)
            db.session.commit()
            db.session.refresh(novo_usuario)
            db.session.remove()
            # RETORNO CRÍTICO: Você entrega a chave privada ao usuário uma única vez
            return {
                "status": "sucesso",
                "chave_privada": private_pem 
            }, 201
            
        except IntegrityError as error:
            db.session.rollback()
            if _is_duplicate_phone_error(error):
                return {
                    "erro": "Este telefone já tem uma conta. Inicie sessão ou use outro número."
                }, 409
            logger.warning(
                "Conflito de integridade ao registar utilizador (%s)",
                type(getattr(error, "orig", error)).__name__,
            )
            return {"erro": "Os dados do cadastro são inválidos ou já estão registados."}, 400
        except Exception as error:
            db.session.rollback()
            logger.error(
                "Falha interna ao registar utilizador (%s)",
                type(error).__name__,
            )
            return {"erro": "Não foi possível concluir o cadastro. Tente novamente."}, 500
