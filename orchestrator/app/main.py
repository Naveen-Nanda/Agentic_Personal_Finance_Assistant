from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import os
import psycopg2
import psycopg2.extras
import json
import datetime
import math
import random
import hashlib

app = FastAPI(title="APFA Orchestrator")

SIM_MODE = os.environ.get("SIM_MODE", "true").lower() == "true"
DB_URL = os.environ.get(
    "DB_URL",
    "postgresql://postgres:postgres@localhost:5432/postgres"
)

def get_db_conn():
    return psycopg2.connect(DB_URL)

def ensure_tables():
    conn = get_db_conn()
    cur = conn.cursor()

    # 1. make sure pgvector is enabled in this DB
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. documents table (stores perks / offers / guidance snippets)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT,
        body TEXT,
        embedding vector(384)
    );
    """)

    # 3. plans table (stores generated advice for auditing / history)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        user_input JSONB,
        plan_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)

    conn.commit()
    cur.close()
    conn.close()


ensure_tables()

class SpendingModel(BaseModel):
    __root__: Dict[str, float]

    def total_spend(self) -> float:
        return sum(self.__root__.values())

class AnalyzeRequest(BaseModel):
    salary: float = Field(..., description="Annual salary in USD")
    spending: SpendingModel = Field(..., description="Monthly spend breakdown")
    credit_cards: List[str] = Field(..., description="User's active cards")
    financial_goals: List[str] = Field(..., description="Goals like 'pay off debt'")

class AnalyzeResponse(BaseModel):
    plan: str
    debug: Dict[str, Any]

def fake_embed(text: str, dim: int = 384):
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    seed = int(h[:8], 16)
    rnd = random.Random(seed)
    return [rnd.random() for _ in range(dim)]

def l2_distance(a, b):
    s = 0.0
    for x, y in zip(a, b):
        diff = x - y
        s += diff * diff
    return math.sqrt(s)

def get_top_docs(user_query: str, k: int = 5):
    q_vec = fake_embed(user_query)

    conn = get_db_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT id, title, body FROM documents;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    scored = []
    for r in rows:
        doc_text = (r["title"] or "") + " " + (r["body"] or "")
        d_vec = fake_embed(doc_text)
        dist = l2_distance(q_vec, d_vec)
        scored.append({
            "id": r["id"],
            "title": r["title"],
            "body": r["body"],
            "score": dist
        })
    scored.sort(key=lambda x: x["score"])
    return scored[:k]

def create_prompt(req: AnalyzeRequest, retrieved_docs):
    perks_summary = "\n\n".join(
        [f"- {d['title']}: {d['body'][:300]}..." for d in retrieved_docs]
    )
    spend_total = req.spending.total_spend()
    goals_txt = ", ".join(req.financial_goals)
    cards_txt = ", ".join(req.credit_cards)

    prompt = f"""
User financial snapshot:
- Annual salary: ${req.salary:,.2f}
- Monthly spend total: ${spend_total:,.2f}
- Cards: {cards_txt}
- Goals: {goals_txt}

Relevant perks / promos / benefits:
{perks_summary}

Task:
Draft a 30/60/90 day plan to optimize spending, use card perks, and move toward the user's goals.
Be concrete. Include dollar amounts or categories to cut, perks to activate, and first actions to take this week.
""".strip()
    return prompt

def generate_plan(prompt: str) -> str:
    if SIM_MODE:
        return (
            "30-Day Plan:\n"
            "1. Activate highest cashback card for groceries.\n"
            "2. Cut $150/mo from non-essential subscriptions.\n"
            "3. Move $300 into emergency fund.\n\n"
            "60-Day Plan:\n"
            "1. Use dining/travel multipliers on Amex Gold.\n"
            "2. Redeem perks mentioned above.\n\n"
            "90-Day Plan:\n"
            "1. Pay down high-interest debt first ($200/mo extra).\n"
            "2. Automate savings toward emergency fund.\n"
            "3. Review card annual fees vs benefits.\n"
        )
    else:
        # Placeholder for real LLM via NVIDIA NIM (GPU path).
        # Since we don't have GPU quota in EKS, we keep SIM_MODE=true in prod.
        return "Real LLM generation would go here."

def persist_plan(req: AnalyzeRequest, plan_text: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO plans (user_input, plan_text, created_at) VALUES (%s, %s, %s) RETURNING id;",
        [
            json.dumps(req.dict()),
            plan_text,
            datetime.datetime.utcnow(),
        ],
    )
    plan_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return plan_id

@app.get("/healthz")
def healthz():
    return {"ok": True, "sim_mode": SIM_MODE}

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    try:
        retrieved = get_top_docs(
            user_query=" ".join(req.financial_goals + req.credit_cards)
        )
        prompt = create_prompt(req, retrieved)
        plan_text = generate_plan(prompt)
        plan_id = persist_plan(req, plan_text)

        return AnalyzeResponse(
            plan=plan_text,
            debug={
                "plan_id": plan_id,
                "sim_mode": SIM_MODE,
                "retrieved_docs_count": len(retrieved),
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))