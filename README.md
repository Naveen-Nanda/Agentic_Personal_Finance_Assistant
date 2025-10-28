# Agentic Personal Finance Assistant (Hackathon Build)

## What this is
End-to-end agentic finance planner:
- User tells income, spending, cards, and goals
- System retrieves relevant credit-card perks from Postgres+pgvector
- LLM (NVIDIA NIM Nemotron) + business logic returns budget, card strategy, and action plan

## Major pieces
- `orchestrator/` FastAPI app
- `deploy/k8s/` Kubernetes manifests for EKS
- `docker/` local docker-compose (CPU sim mode + optional GPU)
- `data/` docs we ingest into Postgres
- `frontend/` Angular app will call `/api/v1/analyze`

## Modes
### Local dev (no GPU, SIM_MODE=true)
1. `cd docker`
2. `docker compose up --build`
3. Call `POST http://localhost:5000/api/v1/analyze`

### Cloud (EKS CPU only, SIM_MODE=true)
1. Deploy `pg.yaml` (which uses pgvector Postgres)
2. Seed DB (CREATE EXTENSION vector; etc.)
3. Build/push orchestrator image to ECR
4. Deploy `orchestrator.yaml` (SIM_MODE=true)
5. Hit `orchestrator` Service LoadBalancer from outside

### Cloud full (GPU node + SIM_MODE=false)
1. Add GPU nodegroup to EKS
2. Create `ngc-secret` for nvcr.io pulls
3. Deploy `emb.yaml` and `llm.yaml`
4. Run `ingest-job.yaml` to fill embeddings
5. `kubectl set env deployment/orchestrator SIM_MODE=false`
6. `kubectl rollout restart deployment/orchestrator`

Now `/api/v1/analyze` uses live NIM inference.
