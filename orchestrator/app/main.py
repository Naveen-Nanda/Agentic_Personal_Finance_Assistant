import os, uuid, json, psycopg2, psycopg2.extras, requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

SIM_MODE = os.getenv("SIM_MODE", "true").lower() == "true"
DB_URL = os.getenv("DB_URL")
NIM_LLM_URL = os.getenv("NIM_LLM_URL", "http://llm:8000")
NIM_EMB_URL = os.getenv("NIM_EMB_URL", "http://emb:8000")

app = FastAPI(title="Agentic Orchestrator")

def db():
    return psycopg2.connect(DB_URL)

class AnalyzeReq(BaseModel):
    salary: int
    spending: dict
    credit_cards: list[dict]
    financial_goals: list[str] = []

_emb_model = None
def embed_texts(texts):
    global _emb_model
    if SIM_MODE:
        from sentence_transformers import SentenceTransformer
        if _emb_model is None:
            _emb_model = SentenceTransformer("intfloat/e5-small-v2")
        return _emb_model.encode(texts, normalize_embeddings=True).tolist()
    else:
        r = requests.post(f"{NIM_EMB_URL}/v1/embeddings", json={"input": texts})
        r.raise_for_status()
        return [d["embedding"] for d in r.json()["data"]]

def top_k(query, k=5):
    qvec = embed_texts([query])[0]
    with db() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, card, issuer, url, text, 1 - (embedding <=> %s::vector) AS score FROM documents ORDER BY embedding <=> %s::vector LIMIT %s;", (qvec, qvec, k))
        return cur.fetchall()

def llm_reason(context, user):
    if SIM_MODE:
        return {"budget": {"essentials": 0.5, "wants": 0.2, "savings": 0.3},
                "cards": {"groceries": "Amex Gold"}, "actions": ["Set auto-save $500"],
                "explain": "Stubbed plan for dev; LLM used in cloud."}
    else:
        messages = [{"role":"user","content":f"User: {user.model_dump()}\nContext:\n{context}\n"}]
        r = requests.post(f"{NIM_LLM_URL}/v1/chat/completions", json={"messages":messages})
        r.raise_for_status()
        return json.loads(r.json()["choices"][0]["message"]["content"])

@app.post("/api/v1/analyze")
def analyze(req: AnalyzeReq):
    if req.salary <= 0:
        raise HTTPException(422, "Invalid salary")
    hits = top_k("best cashback for groceries")
    ctx = "\n\n".join([f"{h['issuer']} {h['card']}: {h['text'][:100]}..." for h in hits])
    plan = llm_reason(ctx, req)
    with db() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO plans(id, payload) VALUES(%s,%s)", (f"plan_{uuid.uuid4().hex[:8]}", psycopg2.extras.Json({"req": req.model_dump(), "plan": plan})))
    return {"plan": plan, "sources": hits}
