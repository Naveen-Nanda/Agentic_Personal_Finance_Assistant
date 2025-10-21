from .config import settings
from typing import List
import requests

_emb_model = None

def embed_texts(texts: List[str]) -> List[List[float]]:
    if settings.SIM_MODE:
        global _emb_model
        from sentence_transformers import SentenceTransformer
        if _emb_model is None:
            _emb_model = SentenceTransformer("intfloat/e5-small-v2")
        return _emb_model.encode(texts, normalize_embeddings=True).tolist()

    r = requests.post(
        f"{settings.NIM_EMB_URL}/v1/embeddings",
        json={"input": texts, "model": "nv-embedqa-e5-v5"},
        timeout=settings.REQUEST_TIMEOUT,
    )
    r.raise_for_status()
    return [d["embedding"] for d in r.json()["data"]]

# hello