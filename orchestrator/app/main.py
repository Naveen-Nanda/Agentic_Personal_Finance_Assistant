from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import os
import uuid
import psycopg2
import psycopg2.extras
import json
import math
import requests

app = FastAPI(
    title="Agentic Personal Finance Orchestrator",
    description="Core reasoning + retrieval + planning service for the hackathon project",
    version="0.1.0",
)


class SpendingBreakdown(BaseModel):
    groceries: float = 0.0
    dining: float = 0.0
    gas: float = 0.0
    travel: float = 0.0
    other: Dict[str, float] = Field(default_factory=dict)


class CreditCardInfo(BaseModel):
    name: str


class AnalyzeRequest(BaseModel):
    salary: float
    spending: SpendingBreakdown
    credit_cards: List[CreditCardInfo]
    financial_goals: List[str]


class CardRecommendation(BaseModel):
    category: str
    recommended_card: str
    rationale: str


class BudgetCategory(BaseModel):
    category: str
    monthly_amount: float
    percent_income: float


class ActionItem(BaseModel):
    title: str
    detail: str


class PlanResponse(BaseModel):
    plan_id: str
    budget_overview: List[BudgetCategory]
    card_strategy: List[CardRecommendation]
    action_items: List[ActionItem]
    model_notes: str
    retrieval_sources: List[Dict[str, Any]]


def get_env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


DB_URL = get_env("DB_URL", "postgresql://postgres:postgres@pg:5432/finx")
SIM_MODE = get_env("SIM_MODE", "true").lower() == "true"
NIM_LLM_URL = get_env("NIM_LLM_URL", "http://llm:8000")
NIM_EMB_URL = get_env("NIM_EMB_URL", "http://emb:8000")
TOP_K = int(get_env("TOP_K", "6"))
REQUEST_TIMEOUT = int(get_env("REQUEST_TIMEOUT", "60"))


def connect_db():
    return psycopg2.connect(DB_URL)


def fetch_all_documents(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, card, issuer, url, text, embedding FROM documents")
        return cur.fetchall()


def cosine_similarity(vec_a, vec_b):
    # basic manual cosine sim
    dot = sum(a*b for a,b in zip(vec_a, vec_b))
    na = math.sqrt(sum(a*a for a in vec_a))
    nb = math.sqrt(sum(b*b for b in vec_b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def retrieve_relevant_docs(query_text: str, conn):
    """
    When SIM_MODE:
        fake a 'query embedding' via trivial hash trick and just return top docs by len(text).
    When real mode:
        call embedding NIM to embed query_text, then rank by cosine against stored embeddings.
    """
    docs = fetch_all_documents(conn)

    if SIM_MODE:
        # dumb scoring heuristic: longer marketing text first
        ranked = sorted(docs, key=lambda d: len(d["text"] or ""), reverse=True)
        return ranked[:TOP_K]

    # real mode path: get query embedding from NIM emb model
    try:
        emb_resp = requests.post(
            f"{NIM_EMB_URL}/v1/embeddings",
            json={"model": "nv-embedqa-e5-v5", "input": [query_text]},
            timeout=REQUEST_TIMEOUT,
        )
        emb_resp.raise_for_status()
        query_vec = emb_resp.json()["data"][0]["embedding"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding request failed: {e}")

    # compute cosine sim locally
    ranked = []
    for d in docs:
        if d["embedding"] is None:
            continue
        sim = cosine_similarity(query_vec, d["embedding"])
        ranked.append((sim, d))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in ranked[:TOP_K]]


def build_prompt(request: AnalyzeRequest, retrieved_docs: List[Dict[str, Any]]) -> str:
    doc_snippets = []
    for d in retrieved_docs:
        snippet = f"- {d['card']} ({d['issuer']}): {d['text']}"
        doc_snippets.append(snippet)

    spending_lines = []
    spending_lines.append(f"groceries: {request.spending.groceries}")
    spending_lines.append(f"dining: {request.spending.dining}")
    spending_lines.append(f"gas: {request.spending.gas}")
    spending_lines.append(f"travel: {request.spending.travel}")
    for k,v in request.spending.other.items():
        spending_lines.append(f"{k}: {v}")

    credit_cards = [c.name for c in request.credit_cards]

    prompt = f\"\"\"You are a personal finance optimization assistant.
User salary (annual): {request.salary}
User monthly spend (usd):
{chr(10).join(spending_lines)}

User credit cards on hand:
{credit_cards}

User financial goals:
{request.financial_goals}

You also have reference info about card perks:
{chr(10).join(doc_snippets)}

TASK:
1. Create monthly budget targets as % of net income.
2. Recommend which existing card to use for each spend category.
3. Give 3-5 concrete action steps (optimize rewards, reduce interest, etc.).
4. Return clean JSON with these exact keys:
   - budget_overview: array of {{category, monthly_amount, percent_income}}
   - card_strategy: array of {{category, recommended_card, rationale}}
   - action_items: array of {{title, detail}}
   - model_notes: string
   - retrieval_sources: array of {{card, issuer, url}}

Keep it realistic and actionable, do not overspend.
\"\"\"
    return prompt


def call_llm(prompt: str) -> dict:
    """
    If SIM_MODE=True:
        return deterministic stub so we can demo without GPU/NIM.
    Otherwise:
        call LLM NIM (llama-3.1-nemotron-nano-8B-v1) using /v1/chat/completions,
        parse JSON from the response.
    """
    if SIM_MODE:
        stub_json = {
            "budget_overview": [
                {
                    "category": "groceries",
                    "monthly_amount": 500,
                    "percent_income": 10.0
                },
                {
                    "category": "dining",
                    "monthly_amount": 300,
                    "percent_income": 6.0
                },
                {
                    "category": "travel",
                    "monthly_amount": 600,
                    "percent_income": 12.0
                }
            ],
            "card_strategy": [
                {
                    "category": "groceries",
                    "recommended_card": "Amex Gold",
                    "rationale": "4x points at U.S. supermarkets."
                },
                {
                    "category": "dining",
                    "recommended_card": "Amex Gold",
                    "rationale": "4x points on dining worldwide."
                },
                {
                    "category": "gas",
                    "recommended_card": "Citi Custom Cash",
                    "rationale": "Earns 5% back in top spend category."
                }
            ],
            "action_items": [
                {
                    "title": "Pay high-interest balances first",
                    "detail": "Focus extra cash on any card APR >20%."
                },
                {
                    "title": "Automate savings goal",
                    "detail": "Auto-transfer $400/mo to vacation fund."
                },
                {
                    "title": "Use dining/grocery multipliers",
                    "detail": "Always swipe Amex Gold at grocery & dining for max return."
                }
            ],
            "model_notes": "SIM_MODE: using stubbed reasoning. In production this is from llama-3.1-nemotron-nano-8B-v1 via NVIDIA NIM.",
            "retrieval_sources": []
        }
        return stub_json

    # real call to LLM NIM
    try:
        payload = {
            "model": "llama-3.1-nemotron-nano-8B-v1",
            "messages": [
                {"role": "system", "content": "You are a financial planning assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 700,
        }
        resp = requests.post(
            f"{NIM_LLM_URL}/v1/chat/completions",
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        # NIM LLM will return a completion with assistant message content.
        # We expect that content to be valid JSON per our instructions.
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM request failed: {e}")


def normalize_sources(retrieved_docs: List[Dict[str, Any]]):
    out = []
    for d in retrieved_docs:
        out.append({
            "card": d.get("card"),
            "issuer": d.get("issuer"),
            "url": d.get("url")
        })
    return out


def persist_plan(plan_payload: dict, conn) -> str:
    plan_id = str(uuid.uuid4())
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO plans (id, payload) VALUES (%s, %s)",
            (plan_id, json.dumps(plan_payload)),
        )
        conn.commit()
    return plan_id


@app.post("/api/v1/analyze", response_model=PlanResponse)
def analyze(req: AnalyzeRequest):
    """
    Main endpoint the frontend will call.
    """
    # 1. connect DB
    conn = connect_db()

    # 2. retrieval context
    #    We'll prompt with "optimize my budget and card strategy"
    retrieval_query = " ".join([
        "optimize rewards",
        "cash back categories",
        "which card for groceries dining gas travel"
    ])
    retrieved_docs = retrieve_relevant_docs(retrieval_query, conn)

    # 3. build prompt for LLM
    prompt = build_prompt(req, retrieved_docs)

    # 4. call LLM / or stub
    llm_json = call_llm(prompt)

    # 5. make sure we add retrieval_sources even if stub doesn't add them
    if not llm_json.get("retrieval_sources"):
        llm_json["retrieval_sources"] = normalize_sources(retrieved_docs)

    # 6. persist
    plan_id = persist_plan(llm_json, conn)

    # 7. respond
    return PlanResponse(
        plan_id=plan_id,
        budget_overview=[BudgetCategory(**b) for b in llm_json["budget_overview"]],
        card_strategy=[CardRecommendation(**c) for c in llm_json["card_strategy"]],
        action_items=[ActionItem(**a) for a in llm_json["action_items"]],
        model_notes=llm_json.get("model_notes",""),
        retrieval_sources=llm_json["retrieval_sources"],
    )
