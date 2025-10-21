import psycopg2, psycopg2.extras
from sentence_transformers import SentenceTransformer
m = SentenceTransformer("intfloat/e5-small-v2")
conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/finx")
cur = conn.cursor()
cur.execute("SELECT id, text FROM documents WHERE embedding IS NULL")
rows = cur.fetchall()
for r in rows:
    emb = m.encode([r[1]], normalize_embeddings=True)[0].tolist()
    cur.execute("UPDATE documents SET embedding=%s WHERE id=%s", (emb, r[0]))
conn.commit(); cur.close(); conn.close()
print("Embedded", len(rows), "docs")
