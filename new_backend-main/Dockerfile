# 1. Usa uma imagem oficial do Python leve
FROM python:3.12-slim

# 2. Define o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copia o arquivo de dependências primeiro (otimiza o cache do Docker)
COPY requirements.txt ./

# 4. Instala as dependências
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copia o restante do código do projeto para dentro do container
COPY . .

# 6. Expõe a porta que o container vai usar (a Northflank vai ler isso)
EXPOSE 5000

# 7. Comando para rodar a aplicação (ajuste para o seu arquivo principal)
# Se usar WebSockets/Socket.IO com Eventlet/Gevent, o Gunicorn gerencia isso bem:
CMD ["gunicorn", "-k", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", "-w", "1", "app:app"]
