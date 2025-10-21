import json, requests, re
from .config import settings
from .prompts import SYSTEM, build_user_prompt
from .schemas import AnalyzeReq, Plan

def _coerce_json(s: str) -> dict:
    m = re.search(r"\{.*\}", s, re.S)
    if m:
        try: return json.loads(m.group(0))
        except: pass
    return {"budget": {"essentials":0.5,"wants":0.2,"savings":0.3}, "cards":{}, "actions":[], "explain": s[:300]}

def llm_reason(req: AnalyzeReq, context: str) -> Plan:
    if settings.SIM_MODE:
        return Plan(
            budget={"essentials":0.5,"wants":0.2,"savings":0.3},
            cards={"groceries":"Amex Gold","dining":"Amex Gold"},
            actions=["Set auto-save $500/month", "Use Amex for groceries/dining"],
            explain="SIM_MODE stub: replace with NIM inference in cloud."
        )

    payload = {
        "model": "llama-3.1-nemotron-nano-8B-v1",
        "messages": [
            {"role":"system","content": SYSTEM},
            {"role":"user","content": build_user_prompt(req, context)}
        ],
        "temperature": 0.2,
    }
    r = requests.post(f"{settings.NIM_LLM_URL}/v1/chat/completions", json=payload, timeout=settings.REQUEST_TIMEOUT)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]
    data = _coerce_json(content)
    return Plan(**data)
