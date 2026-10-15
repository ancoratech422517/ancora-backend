# routes/upload.py
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context
import uuid
import cloudinary.api
import cloudinary.uploader
import cloudinary.utils
import requests
import re
import os
import jwt
import time
from urllib.parse import quote, urlsplit
from werkzeug.utils import secure_filename

upload_bp = Blueprint('upload', __name__, url_prefix='/api')

# Configuração de pastas por tipo de arquivo
FOLDER_MAPPING = {
    'image': 'imagens',
    'video': 'videos',
    'raw': 'documentos',      # pdf, doc, zip, etc.
}

# Extensões permitidas (podes expandir)
ALLOWED_EXTENSIONS = {
    # Imagens
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff',
    # Vídeos
    'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv',
    # Áudio
    'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
    # Documentos e outros
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'csv', 'json', 'zip', 'rar',
    # Modelos de IA
    'gguf', 'ggml', 'safetensors', 'onnx', 'pt', 'pth',
}
MAX_UPLOAD_BYTES = 1024 ** 3
UPLOAD_CHUNK_BYTES = 20 * 1024 * 1024


def get_file_type(filename):
    """Retorna o tipo de arquivo baseado na extensão"""
    if not filename or '.' not in filename:
        return 'raw'
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff']:
        return 'image'
    elif ext in ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv']:
        return 'video'
    else:
        return 'raw'


@upload_bp.route('/create-upload-signature', methods=['POST'])
def create_upload_signature():
    token = request.cookies.get('token_sessao')
    if not token:
        return jsonify({"success": False, "error": "Sessão expirada"}), 401

    try:
        user_claims = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Sessão expirada"}), 401

    data = request.get_json(silent=True) or {}
    filename = str(data.get('filename') or '').strip()
    try:
        file_size = int(data.get('file_size') or 0)
    except (TypeError, ValueError):
        file_size = 0

    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if not filename or extension not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "error": "Tipo de arquivo não permitido"}), 400
    if file_size <= 0 or file_size > MAX_UPLOAD_BYTES:
        return jsonify({"success": False, "error": "O limite máximo é 1 GB"}), 413

    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    api_key = os.getenv('CLOUDINARY_API_KEY', '').strip()
    api_secret = os.getenv('CLOUDINARY_API_SECRET', '').strip()
    if not cloud_name or not api_key or not api_secret:
        current_app.logger.error("Credenciais Cloudinary ausentes para assinar upload em chunks")
        return jsonify({"success": False, "error": "Upload não configurado no servidor"}), 500

    resource_type = get_file_type(filename)
    folder = FOLDER_MAPPING[resource_type]
    public_id = str(uuid.uuid4())
    if resource_type == 'raw':
        public_id = f"{public_id}.{extension}"

    timestamp = int(time.time())
    signed_params = {
        'folder': folder,
        'public_id': public_id,
        'timestamp': timestamp
    }
    upload_ticket = jwt.encode({
        'user_id': user_claims.get('id'),
        'public_id': public_id,
        'resource_type': resource_type,
        'folder': folder,
        'exp': timestamp + 3600
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        "success": True,
        "cloud_name": cloud_name,
        "api_key": api_key,
        "signature": cloudinary.utils.api_sign_request(signed_params, api_secret),
        "timestamp": timestamp,
        "folder": folder,
        "public_id": public_id,
        "resource_type": resource_type,
        "upload_ticket": upload_ticket,
        "upload_id": str(uuid.uuid4()),
        "chunk_size": UPLOAD_CHUNK_BYTES,
        "filename": secure_filename(filename) or 'arquivo'
    })


@upload_bp.route('/finalize-chunked-upload', methods=['POST'])
def finalize_chunked_upload():
    session_token = request.cookies.get('token_sessao')
    if not session_token:
        return jsonify({"success": False, "error": "Sessão expirada"}), 401

    data = request.get_json(silent=True) or {}
    try:
        user_claims = jwt.decode(
            session_token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        ticket = jwt.decode(
            data.get('upload_ticket', ''),
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Assinatura de upload inválida ou expirada"}), 401

    if str(ticket.get('user_id')) != str(user_claims.get('id')):
        return jsonify({"success": False, "error": "Este upload pertence a outra sessão"}), 403

    requested_public_id = ticket.get('public_id')
    folder = ticket.get('folder')
    uploaded_public_id = str(data.get('public_id') or '')
    resource_type = ticket.get('resource_type')
    allowed_public_ids = {requested_public_id, f'{folder}/{requested_public_id}'}
    if (
        not requested_public_id
        or uploaded_public_id not in allowed_public_ids
        or resource_type not in ('image', 'video', 'raw')
    ):
        return jsonify({"success": False, "error": "Dados do upload inválidos"}), 400

    asset = None
    public_id = None
    for candidate in (uploaded_public_id, requested_public_id):
        try:
            asset = cloudinary.api.resource(candidate, resource_type=resource_type)
            public_id = candidate
            break
        except Exception as error:
            current_app.logger.info(f"Cloudinary ainda não encontrou {candidate}: {error}")
    if asset is None:
        current_app.logger.error(f"Asset chunked não encontrado após upload: {uploaded_public_id}")
        return jsonify({"success": False, "error": "Cloudinary não confirmou o arquivo completo"}), 502

    actual_size = int(asset.get('bytes') or 0)
    if actual_size <= 0 or actual_size > MAX_UPLOAD_BYTES:
        try:
            cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception:
            current_app.logger.exception("Falha ao remover upload acima do limite permitido")
        return jsonify({"success": False, "error": "O limite máximo é 1 GB"}), 413

    file_name = str(data.get('filename') or 'arquivo').replace('\\', '/').rsplit('/', 1)[-1]
    mime_type = str(data.get('mime_type') or 'application/octet-stream')[:255]
    file_url = asset.get('secure_url')
    if not file_url:
        file_url = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            version=asset.get('version'),
            secure=True
        )[0]

    parsed_url = urlsplit(file_url)
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    if (
        parsed_url.scheme != 'https'
        or parsed_url.netloc != 'res.cloudinary.com'
        or not parsed_url.path.startswith(f'/{cloud_name}/{resource_type}/upload/')
    ):
        current_app.logger.error(f"URL de asset inválida retornada pelo Cloudinary: {file_url}")
        return jsonify({"success": False, "error": "Cloudinary devolveu uma URL inválida"}), 502

    return jsonify({
        "success": True,
        "file_url": file_url,
        "public_id": asset.get('public_id') or public_id,
        "filename": file_name,
        "size": actual_size,
        "mime_type": mime_type,
        "format": asset.get('format'),
        "resource_type": resource_type,
        "folder": ticket.get('folder'),
        "asset_id": asset.get('asset_id')
    })


@upload_bp.route('/upload-file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"success": False, "error": "Nome do arquivo vazio"}), 400

    if not file.filename.rsplit('.', 1)[-1].lower() in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "error": "Tipo de arquivo não permitido"}), 400

    try:
        # Detecta o tipo do arquivo
        file_type = get_file_type(file.filename)
        
        # Define a pasta no Cloudinary
        folder = FOLDER_MAPPING.get(file_type, 'outros')
        
        # Gera nome único
        ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        unique_id = str(uuid.uuid4())
        public_id = f"{unique_id}.{ext}" if file_type == 'raw' and ext else unique_id

        # Upload para o Cloudinary com pasta
        upload_result = cloudinary.uploader.upload(
            file,
            public_id=public_id,
            resource_type=file_type,
            folder=folder,
            overwrite=False
        )

        secure_url = upload_result.get('secure_url')
        stored_public_id = upload_result.get('public_id')
        stored_resource_type = upload_result.get('resource_type')
        parsed_secure_url = urlsplit(secure_url or '')
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
        expected_url_prefix = f'/{cloud_name}/{file_type}/upload/'
        if (
            not cloud_name
            or not secure_url
            or not stored_public_id
            or stored_resource_type != file_type
            or parsed_secure_url.scheme != 'https'
            or parsed_secure_url.netloc != 'res.cloudinary.com'
            or not parsed_secure_url.path.startswith(expected_url_prefix)
        ):
            current_app.logger.error(
                "Cloudinary upload returned incomplete metadata: "
                f"resource_type={stored_resource_type}, public_id={stored_public_id}, "
                f"url={secure_url}"
            )
            return jsonify({"success": False, "error": "Cloudinary não confirmou o armazenamento do arquivo"}), 502

        current_app.logger.info(
            "Cloudinary upload confirmed: "
            f"asset_id={upload_result.get('asset_id')}, resource_type={stored_resource_type}, "
            f"bytes={upload_result.get('bytes')}, public_id={stored_public_id}"
        )

        return jsonify({
            "success": True,
            "file_url": secure_url,
            "public_id": stored_public_id,
            "folder": folder,
            "filename": file.filename,
            "size": upload_result['bytes'],
            "mime_type": file.mimetype or "application/octet-stream",
            "format": upload_result.get('format'),
            "resource_type": stored_resource_type,
            "asset_id": upload_result.get('asset_id'),
            "version": upload_result.get('version')
        })

    except Exception as e:
        current_app.logger.error(f"Erro no upload Cloudinary: {str(e)}")
        return jsonify({"success": False, "error": "Erro ao fazer upload"}), 500


@upload_bp.route('/download-file', methods=['GET'])
def download_file():
    file_url = request.args.get('file_url', '').strip()
    public_id = request.args.get('public_id', '').strip()
    file_name = request.args.get('filename', 'arquivo').strip()
    parsed_url = urlsplit(file_url)
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    expected_path = f'/{cloud_name}/raw/upload/'
    public_id_candidates = []
    raw_path_id = parsed_url.path.partition('/raw/upload/')[2]
    if raw_path_id:
        raw_path_id = re.sub(r'^v[0-9]+/', '', raw_path_id)
        public_id_candidates.extend((raw_path_id, raw_path_id.removeprefix('documentos/')))
    public_id_candidates.insert(0, public_id)
    public_id_candidates = list(dict.fromkeys(
        candidate for candidate in public_id_candidates
        if re.fullmatch(r'(?:documentos/)?[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?', candidate)
    ))

    if (
        not cloud_name
        or parsed_url.scheme != 'https'
        or parsed_url.netloc != 'res.cloudinary.com'
        or parsed_url.query
        or parsed_url.fragment
        or not parsed_url.path.startswith(expected_path)
        or '..' in parsed_url.path.split('/')
        or not re.fullmatch(
            rf'/{re.escape(cloud_name)}/raw/upload/(?:v[0-9]+/)?[A-Za-z0-9_./-]+',
            parsed_url.path
        )
    ):
        return jsonify({"success": False, "error": "Arquivo inválido"}), 400

    file_name = file_name.replace('\\', '/').rsplit('/', 1)[-1] or 'arquivo'
    try:
        upstream = requests.get(file_url, stream=True, timeout=(10, 120))
        if upstream.status_code != 200:
            upstream.close()

            if public_id_candidates:
                for candidate in public_id_candidates:
                    try:
                        asset = cloudinary.api.resource(candidate, resource_type='raw')
                        canonical_url = asset.get('secure_url', '')
                        canonical_parts = urlsplit(canonical_url)
                        if (
                            canonical_parts.scheme == 'https'
                            and canonical_parts.netloc == 'res.cloudinary.com'
                            and canonical_parts.path.startswith(expected_path)
                        ):
                            upstream = requests.get(canonical_url, stream=True, timeout=(10, 120))
                        else:
                            upstream = None
                        break
                    except Exception as error:
                        current_app.logger.info(
                            f"Cloudinary não encontrou o public_id {candidate}: {error}"
                        )
                        upstream = None

            if upstream is None or upstream.status_code != 200:
                status = upstream.status_code if upstream is not None else 'indisponível'
                if upstream is not None:
                    upstream.close()
                current_app.logger.error(
                    f"Download Cloudinary falhou: status={status}, public_id={public_id}, url={file_url}"
                )
                return jsonify({"success": False, "error": "Arquivo não encontrado no armazenamento"}), 404

        safe_name = secure_filename(file_name) or 'arquivo'
        disposition = (
            f'attachment; filename="{safe_name}"; '
            f"filename*=UTF-8''{quote(file_name, safe='')}"
        )

        def stream_file():
            try:
                for chunk in upstream.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        yield chunk
            finally:
                upstream.close()

        headers = {
            'Content-Disposition': disposition,
            'X-Content-Type-Options': 'nosniff'
        }
        if upstream.headers.get('Content-Length'):
            headers['Content-Length'] = upstream.headers['Content-Length']

        return Response(
            stream_with_context(stream_file()),
            content_type='application/octet-stream',
            headers=headers
        )
    except requests.RequestException as error:
        current_app.logger.error(f"Erro ao baixar arquivo do Cloudinary: {error}")
        return jsonify({"success": False, "error": "Não foi possível baixar o arquivo"}), 502