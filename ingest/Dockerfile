FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ingest.py .
COPY documents_seed.json .

ENV DB_URL=postgresql://postgres:postgres@pg.finance.svc.cluster.local:5432/postgres

CMD ["python", "ingest.py"]