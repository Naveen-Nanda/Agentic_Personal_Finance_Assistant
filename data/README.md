# data Folder

Put any marketing copy, credit card perk text, promo language, benefit explanations, etc. you want to load.

These eventually get embedded and inserted into Postgres by the ingest job.

In production-with-GPU mode:
- we'd call NVIDIA NIM embedding service
- we'd store real vector embeddings into pgvector

In fallback CPU-only mode (SIM_MODE=true):
- we call `fake_embed()` to make deterministic vectors so that retrieval ordering is stable for demos