import psycopg2, psycopg2.extras
from .config import settings

def get_conn():
    return psycopg2.connect(settings.DB_URL)

def fetch_all(sql, params=()):
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        return cur.fetchall()

def execute(sql, params=()):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)

def upsert_plan(plan_id: str, payload: dict):
    execute("INSERT INTO plans(id, payload) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
            (plan_id, psycopg2.extras.Json(payload)))
