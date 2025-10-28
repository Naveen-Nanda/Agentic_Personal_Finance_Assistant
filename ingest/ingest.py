import os, json, psycopg2, hashlib, random

DB_URL = os.environ.get("DB_URL", "postgresql://postgres:postgres@pg:5432/postgres")

def fake_embed(text: str, dim: int = 384):
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    seed = int(h[:8], 16)
    rnd = random.Random(seed)
    return [rnd.random() for _ in range(dim)]

def main():
    with open("documents_seed.json", "r", encoding="utf-8") as f:
        docs = json.load(f)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT,
        body TEXT,
        embedding vector(384)
    );
    """)

    for d in docs:
        title = d["title"]
        body = d["body"]
        emb = fake_embed(title + " " + body)
        emb_literal = "[" + ",".join(str(x) for x in emb) + "]"

        cur.execute(
            """
            INSERT INTO documents (title, body, embedding)
            VALUES (%s, %s, %s::vector)
            """,
            [title, body, emb_literal]
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Ingest complete.")

if __name__ == "__main__":
    main()