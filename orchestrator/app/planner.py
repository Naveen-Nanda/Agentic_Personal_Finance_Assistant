from .schemas import AnalyzeReq, Plan

CATEGORY_TO_CARD_HINTS = {
    "groceries": ["Amex Gold","Chase Freedom","Citi Custom Cash"],
    "dining":    ["Amex Gold","SavorOne"],
    "travel":    ["Chase Sapphire Preferred","Amex Gold"],
    "gas":       ["Citi Custom Cash","Costco Visa"]
}

def apply_rules(req: AnalyzeReq, plan: Plan) -> Plan:
    for cat in req.spending.keys():
        if cat not in plan.cards:
            for candidate in CATEGORY_TO_CARD_HINTS.get(cat, []):
                if any(candidate.lower() in c.name.lower() for c in req.credit_cards):
                    plan.cards[cat] = candidate
                    break
    total = sum(plan.budget.values()) or 1.0
    plan.budget = {k: round(v/total, 2) for k, v in plan.budget.items()}
    return plan
