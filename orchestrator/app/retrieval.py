from typing import List, Dict, Any
from .embeddings import embed_texts
from .db import fetch_all
from .config import settings

def retrieve(query: str, k: int | None = None) -> List[Dict[str, Any]]:
    k = k or settings.TOP_K
    qvec = embed_texts([query])[0]
    sql = '''
      SELECT id, card, issuer, url, text,
             1 - (embedding <=> %s::vector) AS score
      FROM documents
      ORDER BY embedding <=> %s::vector
      LIMIT %s;
    '''
    return fetch_all(sql, (qvec, qvec, k))
