FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# system deps for psycopg2
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# defaults for local/dev
ENV SIM_MODE=true
ENV DB_URL=postgresql://postgres:postgres@pg:5432/postgres

EXPOSE 5000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]