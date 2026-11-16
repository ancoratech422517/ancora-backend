FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
COPY vendor/ancorashield ./vendor/ancorashield
RUN pip install --no-cache-dir -r requirements.txt

RUN addgroup --system --gid 10001 ancora \
    && adduser --system --uid 10001 --ingroup ancora --home /home/ancora ancora \
    && mkdir -p /app/instance \
    && chown ancora:ancora /app/instance

COPY --chown=ancora:ancora . .

USER ancora:ancora

EXPOSE 5000

CMD ["gunicorn", "-k", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", "-w", "1", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info", "app:app"]
