import os
import json
import datetime
import math
import random
import hashlib
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any

# ---------------------------------------------------------------------------------
# Startup debug info so we can see what's going on in `docker compose up`
# ---------------------------------------------------------------------------------

print(">>> orchestrator: importing main.py")

app = FastAPI(title="APFA Orchestrator")

SIM_MODE = os.environ.get("SIM_MODE", "true").lower() == "true"
DB_URL = os.environ.get(
    "DB_URL",
    # fallback for bare-metal local testing
    "postgresql://postgres:postgres@localhost:5432/postgres"
)

print(">>> orchestrator: SIM_MODE =", SIM_MODE)
print(">>> orchestrator: DB_URL =", DB_URL)


# ---------------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------------

def get_db_conn():
    """
    Create and return a psycopg2 connection using DB_URL.
    We print for debugging so we can see if the container is actually connecting
    to the right hostname (should be 'pg' in docker-compose).
    """
    print(">>> orchestrator: get_db_conn() connecting to", DB_URL)
    return psycopg2.connect(DB_URL)


def ensure_tables():
    """
    Lazily ensure that:
    - pgvector extension is enabled
    - documents table exists (stores perks / promo blurbs / guidance)
    - plans table exists (stores generated responses / audit trail)

    We DO NOT call this at import time. We call it inside /healthz and /api/v1/analyze.
    That way uvicorn can boot even if Postgres isn't quite ready yet.
    """
    print(">>> orchestrator: ensure_tables() start")
    conn = get_db_conn()
    cur = conn.cursor()

    # enable pgvector extension so we can store embeddings as vector(384)
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # stores the "knowledge base" rows we retrieve later
    cur.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT,
        body TEXT,
        embedding vector(384)
    );
    """)

    # stores generated plans per request
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
    print(">>> orchestrator: ensure_tables() done")


# ---------------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    salary: float = Field(..., description="Annual salary in USD")

    # spending is now just a dict category->monthly dollars, pydantic v2 friendly
    spending: Dict[str, float] = Field(
        ..., description="Monthly spend breakdown, e.g. {'rent':1500,'food':600}"
    )

    credit_cards: List[str] = Field(
        ..., description="User's active cards"
    )

    financial_goals: List[str] = Field(
        ..., description="Goals like 'pay off debt', 'build emergency fund'"
    )

    def total_spend(self) -> float:
        # sum of all categories in spending
        return sum(self.spending.values())


class AnalyzeResponse(BaseModel):
    plan: str
    debug: Dict[str, Any]


# ---------------------------------------------------------------------------------
# Retrieval helpers (fake embeddings + vector similarity on CPU)
# ---------------------------------------------------------------------------------

def fake_embed(text: str, dim: int = 384) -> List[float]:
    """
    Deterministic CPU-only "embedding."
    This simulates NVIDIA embeddings so we can RAG without GPU quota.
    Same text -> same vector, but we never touch a GPU.
    """
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    seed = int(h[:8], 16)
    rnd = random.Random(seed)
    return [rnd.random() for _ in range(dim)]


def l2_distance(a: List[float], b: List[float]) -> float:
    s = 0.0
    for x, y in zip(a, b):
        diff = x - y
        s += diff * diff
    return math.sqrt(s)


def get_top_docs(user_query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieval flow:
    1. Embed the user query with fake_embed().
    2. Fetch all docs from Postgres (documents table).
    3. Compute fake_embed() for each doc.
    4. Rank by L2 distance and return top k.

    In production-with-GPU mode we'd call an NVIDIA NIM embedding service
    and do ORDER BY embedding <-> query_embedding in Postgres with pgvector.
    """
    print(">>> orchestrator: get_top_docs() for query:", user_query)
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
    top = scored[:k]
    print(">>> orchestrator: get_top_docs() returning", len(top), "docs")
    return top


# ---------------------------------------------------------------------------------
# Prompt building + Plan generation
# ---------------------------------------------------------------------------------

def create_prompt(req: AnalyzeRequest, retrieved_docs: List[Dict[str, Any]]) -> str:
    """
    Build a nice instruction prompt that:
    - includes user's salary / spend profile / goals / cards
    - includes relevant perk snippets retrieved from Postgres
    """
    perks_summary = "\n\n".join(
        [f"- {d['title']}: {d['body'][:300]}..." for d in retrieved_docs]
    )

    spend_total = req.total_spend()
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
    """
    If SIM_MODE=true:
      Return a deterministic, LLM-style plan that sounds smart.
      This is our "no GPU quota" safe mode.
    If SIM_MODE=false:
      (Not active on your account because AWS denied GPU instances)
      We'd call a GPU-backed NVIDIA NIM LLM service hosted in the cluster.
    """
    print(">>> orchestrator: generate_plan() SIM_MODE =", SIM_MODE)

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
        # Future path for real GPU inferencing:
        # resp = requests.post("http://llm.finance.svc.cluster.local:8000/generate", json={"prompt": prompt})
        # return resp.json()["text"]
        return "Real LLM generation would go here."


def persist_plan(req: AnalyzeRequest, plan_text: str) -> int:
    """
    Save the generated plan into Postgres for auditing / UI history.
    """
    print(">>> orchestrator: persist_plan()")
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
    print(">>> orchestrator: persist_plan() saved id", plan_id)
    return plan_id


# ---------------------------------------------------------------------------------
# FastAPI routes
# ---------------------------------------------------------------------------------

@app.get("/healthz")
def healthz():
    """
    Sanity probe:
    - returns sim_mode
    - tries to init DB/tables/extensions
    - tells you if DB is reachable yet
    """
    print(">>> orchestrator: /healthz called")
    db_ok = True
    try:
        ensure_tables()
    except Exception as e:
        print(">>> orchestrator: healthz DB error:", e)
        db_ok = False

    return {"ok": True, "db_ok": db_ok, "sim_mode": SIM_MODE}


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    """
    Main reasoning endpoint (what your frontend calls):
    1. Ensure DB and tables exist (lazy init).
    2. Retrieve top relevant perks / guidance snippets from Postgres.
    3. Craft a personalized plan (SIM_MODE=fake-LLM or future real GPU LLM).
    4. Store the plan in Postgres.
    5. Return plan + debug info.
    """
    print(">>> orchestrator: /api/v1/analyze called with", req.dict())

    # Make sure db/tables/extensions are in place
    ensure_tables()

    try:
        # Retrieval step: "vector" search via fake_embed()
        retrieved = get_top_docs(
            user_query=" ".join(req.financial_goals + req.credit_cards)
        )

        # Prompt assembly
        prompt = create_prompt(req, retrieved)

        # Plan generation (SIM_MODE true = GPU-free deterministic agent)
        plan_text = generate_plan(prompt)

        # Save plan to DB for audit / history
        plan_id = persist_plan(req, plan_text)

        # Response object
        return AnalyzeResponse(
            plan=plan_text,
            debug={
                "plan_id": plan_id,
                "sim_mode": SIM_MODE,
                "retrieved_docs_count": len(retrieved),
            }
        )
    except Exception as e:
        print(">>> orchestrator: analyze() ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
