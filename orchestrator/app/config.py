import os

class Settings:
    SIM_MODE: bool = os.getenv("SIM_MODE", "true").lower() == "true"
    DB_URL: str = os.getenv("DB_URL", "postgresql://postgres:postgres@pg:5432/finx")
    NIM_LLM_URL: str = os.getenv("NIM_LLM_URL", "http://llm:8000")
    NIM_EMB_URL: str = os.getenv("NIM_EMB_URL", "http://emb:8000")
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "60"))
    TOP_K: int = int(os.getenv("TOP_K", "6"))

settings = Settings()
