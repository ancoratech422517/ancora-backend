# AncoraShield V2

Biblioteca Python para criptografia aplicada e proteções defensivas de APIs.
Os módulos de criptografia, autenticação, auditoria, validação e integrações
ficam separados em `ancorashield/`.

## Instalação

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[flask,database,dev]"
.\.venv\Scripts\python.exe -m pytest
```
As dependências de criptografia/autenticação são `cryptography`, `argon2-cffi`,
`jwcrypto` e `PyJWT`. Flask e SQLAlchemy são integrações opcionais.

# Crie o ambiente, se ainda não existir
cd "C:\caminho\para\meu_projeto"
py -m venv .venv

# Instale a AncoraShield no ambiente desse projeto
cd "C:\Users\Ancora Tech\Desktop\ancora_blue_team"
& "C:\caminho\para\meu_projeto\.venv\Scripts\python.exe" -m pip install -e ".[flask,database]"


## Criptografia

```python
from ancorashield import AESGCMCipher

key = AESGCMCipher.generate_key()  # grave em KMS/secret manager
cipher = AESGCMCipher(key)
envelope = cipher.encrypt(b"dado sensivel", aad=b"tabela.coluna:v1")
plaintext = cipher.decrypt(envelope, aad=b"tabela.coluna:v1")
```

O envelope contém versão, identificador do algoritmo, nonce aleatório de 96
bits e ciphertext autenticado. Cada cifragem gera nonce novo; os dados
associados (AAD) vinculam o ciphertext ao contexto e também são verificados na
leitura. Não derive chaves diretamente de senhas nem reutilize a mesma chave
entre ambientes. Nonces aleatórios tornam colisões extremamente improváveis,
mas não matematicamente impossíveis: para volumes altos ou requisitos de
garantia estrita de não reutilização, use um KMS/protocolo de gerenciamento de
nonce apropriado. AES-GCM e ChaCha20-Poly1305 não precisam de salt quando
usados com chaves aleatórias; Argon2id trata a derivação/salt de senhas.

O `SigningKey` gera assinaturas Ed25519. Guarde as chaves privadas em cofre de
segredos; o método `private_bytes(password=...)` exporta PEM protegido.
Carregue-o com `SigningKey.from_pem(private_pem, password=...)`.
`PasswordHasher` usa Argon2id com 64 MiB, 3 iterações, paralelismo 4, saída de
32 bytes e salt aleatório de 16 bytes.

## Campos e auditoria

`SensitiveField` pede autorização explícita antes da descriptografia e executa
uma callback de auditoria em cada tentativa. Tanto autorização quanto callback
devem falhar de forma fechada; não registre plaintext, tokens, senhas ou
segredos nos detalhes da auditoria.

`AuditLog` grava eventos JSONL encadeados por SHA-256 e assinados com Ed25519.
Verifique a cadeia com `verify()` e proteja a chave pública esperada fora do
mesmo domínio administrativo do arquivo. O arquivo é **tamper-evident**, não
fisicamente imutável: usuário com permissão de escrita pode truncá-lo ou
removê-lo. Para retenção e não repúdio operacionais, replique para armazenamento
append-only/WORM ou serviço externo, com controle de acesso e backup.
O lock protege apenas threads da mesma instância; em workers/processos
concorrentes, use um backend de auditoria centralizado ou um mecanismo de lock
compartilhado.

## Campos SQLAlchemy criptografados

Instale `ancorashield[database]` e use `EncryptedText` ou `EncryptedBytes`
como tipo de coluna; o valor é cifrado no bind e decifrado na leitura. Veja
[`examples/sqlalchemy_encrypted.py`](examples/sqlalchemy_encrypted.py). O
contexto AAD deve identificar unicamente tabela/coluna e permanecer estável
durante o ciclo de vida dos dados. Isso é criptografia na aplicação, não
criptografia do disco do PostgreSQL: faça backups, controle de acesso e rotação
de chaves. AAD fixo por coluna não vincula o ciphertext à chave primária da
linha; aplicações que precisam de proteção contra troca entre linhas devem
adicionar um formato que autentique também a identidade imutável do registro.

## Tokens JWE/JWS, RBAC e ABAC

`SessionTokenManager` aceita JWS EdDSA (Ed25519) dentro de um JWE
RSA-OAEP-256/A256GCM. A validação restringe algoritmos, `issuer`, `audience`,
`subject`, `issued-at`, `expiration`, `jti` e `roles`; falhas viram um erro
genérico de autenticação. O serviço de API pode carregar **somente** a chave
pública Ed25519 de verificação e a chave privada RSA de decifragem. O emissor
deve manter a chave privada de assinatura e usar a chave RSA pública da API.
Não gere chaves efêmeras a cada inicialização: mantenha-as em KMS/secret
manager, com rotação planejada e pares corretos.

O serviço emissor pode operar sem as chaves privadas de validação/decifragem:

```python
issuer = SessionTokenManager.from_pem(
    signing_private_pem=signing_private_pem,
    signing_private_password=signing_password,
    encryption_public_pem=api_rsa_public_pem,
    issuer="https://identity.example",
    audience="ancorashield-api",
)
token = issuer.issue(
    "user-123",
    roles=["merchant"],
    claims={"tenant_id": "tenant-42"},
)
```

O serviço de API configura o mesmo gestor com apenas
`verification_public_pem` e `decryption_private_pem`; use
`decryption_private_password` para PEM RSA protegido.

```python
from ancorashield.integrations.flask import ApiSecurity, secure_route
from ancorashield.auth.rate_limit import RateLimiter
from ancorashield.validation import safe_string_field

ApiSecurity(
    token_manager=tokens,
    audit_log=audit,
    rate_limiter=RateLimiter(max_requests=120, window_seconds=60),
).init_app(app)

@app.post("/payments")
@secure_route(
    required_roles=["merchant", "admin"],
    input_schema={
        "tenant_id": safe_string_field(
            min_length=1, max_length=36, pattern=r"[a-zA-Z0-9-]+"
        ),
        "reference": safe_string_field(
            min_length=1, max_length=32, pattern=r"[A-Z0-9-]+"
        ),
    },
    policy=lambda principal, payload: (
        principal.get("tenant_id") == payload.get("tenant_id")
    ),
)
def create_payment():
    payload = g.secure_payload
    ...
```

`required_roles` permite qualquer um dos papéis listados; `policy` é uma
verificação ABAC adicional. Veja a integração completa em
[`examples/flask_app.py`](examples/flask_app.py). O rate limiter incluído é
local ao processo e usa o endereço remoto da conexão, não cabeçalho
`X-Forwarded-For`; em ambientes multiworker/multirreplica, substitua-o por um
backend distribuído atômico, como Redis, e configure proxies confiáveis.
Tokens não têm revogação/revogação imediata embutida; complemente com sessões,
denylist ou introspecção se a política exigir.

## Entrada, SQL e XSS

`secure_route` pode validar corpo JSON com esquema estrito antes da lógica de
negócio; validadores allowlist como `safe_string_field` e `integer_field`
restringem tipos, tamanhos e formatos declarados. Não existe sanitizador
universal capaz de detectar ou bloquear todo SQL injection, XSS ou command
injection. Use queries parametrizadas (como no
[`examples/postgresql.py`](examples/postgresql.py)), escape conforme o contexto
de saída e nunca passe entrada para shell/comandos. A aplicação também deve
configurar TLS, CSRF quando aplicável, CSP e limites de payload.

## Flask

Veja [`examples/flask_app.py`](examples/flask_app.py). A proteção recomendada
para V2 é `ApiSecurity.init_app(app)` junto com `@secure_route`, que valida o
Bearer JWE, roles, política opcional e esquema JSON. Os helpers
`require_roles`, `decrypt_payload` e `encrypted_json_response` continuam
disponíveis para migração de código antigo. Configure TLS, limites de taxa
distribuídos, rotação de chaves, gestão de sessão e use servidor WSGI de
produção; nunca ative debug em produção.

## Escopo e implantação

Esta versão é um ponto de partida, não uma certificação nem um substituto para
revisão criptográfica. Planeje rotação/versionamento de chaves, KMS, migração de
dados, limites de taxa, políticas de retenção e monitoramento antes da produção.
Não há defesa automática capaz de sanar SQL injection no driver nem XSS por
sanitização genérica de entrada.
