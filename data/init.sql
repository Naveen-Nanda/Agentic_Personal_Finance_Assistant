CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS documents(
  id TEXT PRIMARY KEY,
  card TEXT,
  issuer TEXT,
  url TEXT,
  text TEXT,
  embedding vector(384)
);
CREATE TABLE IF NOT EXISTS plans(
  id TEXT PRIMARY KEY,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
