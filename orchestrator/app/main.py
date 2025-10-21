import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import AnalyzeReq, AnalyzeResp, SourceDoc
from .retrieval import retrieve
from .llm import llm_reason
from .planner import apply_rules
from .db import upsert_plan

app = FastAPI(title="Agentic Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.post("/api/v1/analyze", response_model=AnalyzeResp)
def analyze(req: AnalyzeReq):
    if req.salary <= 0:
        raise HTTPException(422, "salary must be > 0")

    hits = retrieve("best rewards for groceries, dining, gas, travel", k=6)
    context = "\n\n".join([f"{h['issuer']} {h['card']}: {h['text'][:400]}..." for h in hits])

    plan = llm_reason(req, context)
    plan = apply_rules(req, plan)

    plan_id = f"plan_{uuid.uuid4().hex[:10]}"
    upsert_plan(plan_id, {"req": req.model_dump(), "plan": plan.model_dump()})

    return AnalyzeResp(
        plan=plan,
        sources=[SourceDoc(title=f"{h['issuer']} {h['card']}", url=h["url"], score=float(h["score"])) for h in hits]
    )
