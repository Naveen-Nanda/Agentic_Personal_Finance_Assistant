from .schemas import AnalyzeReq

SYSTEM = "You are a concise, helpful personal finance planner. Return only valid JSON."

def build_user_prompt(req: AnalyzeReq, context: str) -> str:
    return (
        "Provide a 3-bucket budget and card-by-category mapping.\n"
        "Return JSON with keys: budget{essentials,wants,savings}, "
        "cards{category->cardName}, actions[], explain.\n\n"
        f"USER_DATA:\n{req.model_dump()}\n\n"
        f"KNOWLEDGE:\n{context}\n"
    )
