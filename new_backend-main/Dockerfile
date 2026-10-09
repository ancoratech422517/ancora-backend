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

# 6. Expõe a porta que o container vai usar
EXPOSE 5000

# 7. Comando otimizado para Gunicorn com logs ativados no console
CMD ["gunicorn", "-k", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", "-w", "1", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info", "app:app"]

