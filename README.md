# FinX Hackathon Project (CPU-Only Demo Ready)

This repo gives you:
- `orchestrator/`: FastAPI service (`/api/v1/analyze`) that builds a personalized financial plan
- `pgvector` Postgres for perk/offer memory
- Local dev via Docker Compose
- EKS deployment (namespace `finance`) with LoadBalancer exposure
- A CPU-only ingest job that preloads example credit card perks and embeddings
- A SIM_MODE flow that acts like an NVIDIA NIM LLM without needing GPU quota

## Modes

### 1. Local Dev
```bash
cd docker
docker compose up --build
# orchestrator -> http://localhost:5000
```

Test the endpoint:
```bash
curl -X POST http://localhost:5000/api/v1/analyze   -H "Content-Type: application/json"   -d '{
    "salary": 95000,
    "spending": {"rent":1500,"food":600,"subscriptions":120,"misc":400},
    "credit_cards":["chase_freedom","amex_gold"],
    "financial_goals":["pay off debt","build emergency fund"]
  }'
```

You get back:
- a 30/60/90 day savings/action plan
- debug info with a `plan_id` that was stored in Postgres

### 2. Push Images to ECR (orchestrator + ingest)

```bash
# create repos (one-time)
aws ecr create-repository --repository-name finx-orchestrator --region us-east-1
aws ecr create-repository --repository-name finx-ingest --region us-east-1

# login docker to ECR
aws ecr get-login-password --region us-east-1 | docker login   --username AWS   --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# build + push orchestrator
docker build -t finx-orchestrator:latest ./orchestrator
docker tag finx-orchestrator:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finx-orchestrator:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finx-orchestrator:latest

# build + push ingest
docker build -t finx-ingest:latest ./ingest
docker tag finx-ingest:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finx-ingest:latest
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finx-ingest:latest
```

### 3. Deploy Minimal CPU-Only Stack on EKS

Prereqs:
- `kubectl` is pointed at your cluster
- You have permissions to create LoadBalancers
- No GPU nodegroup needed

```bash
# create namespace + Postgres
kubectl apply -f deploy/k8s/pg.yaml

# deploy orchestrator (SIM_MODE=true, CPU only)
# edit deploy/k8s/orchestrator.yaml and replace <YOUR_AWS_ACCOUNT_ID>
kubectl apply -f deploy/k8s/orchestrator.yaml
```

Check services:
```bash
kubectl -n finance get svc orchestrator
```
Grab the `EXTERNAL-IP`. That is your public endpoint.

### 4. Ingest Perk Docs (CPU fake-embeddings)

We simulate "NVIDIA embeddings + RAG" without GPUs.  
We run a job that:
- loads `ingest/documents_seed.json`
- creates deterministic fake embeddings
- stores them in Postgres `documents` table (`vector(384)` column)

```bash
# edit deploy/k8s/ingest-job.yaml to use your AWS account ID
kubectl apply -f deploy/k8s/ingest-job.yaml
kubectl -n finance logs job/ingest-job
```

After this, `/api/v1/analyze` will:
1. pull relevant perk text from Postgres
2. build a spending plan prompt
3. generate a realistic 30/60/90 day plan in SIM_MODE
4. save the plan in the `plans` table

### 5. Judge Demo Script

**Say this out loud:**
1. "User gives salary, expenses, cards, and goals."
2. "We embed our perks/offers and store them in pgvector."
3. "We retrieve the best perks for *this* user, then generate a personalized 30/60/90 day plan."
4. "We designed GPU-backed NVIDIA NIM microservices (LLM + embeddings) for production. Amazon didn’t grant GPU quota for this account, so our SIM_MODE flag runs a CPU-only fallback that mimics the same flow. Flipping `SIM_MODE=false` and deploying the NIM containers on a GPU node group is all that’s left."

That story shows:
- Retrieval-Augmented Generation with finance perks
- Kubernetes microservice architecture
- Cost-aware fallback when GPU quota is denied

You are production-minded and cost-aware. Judges LOVE that.

### 6. Frontend Contract

Your Angular / web UI can call:

```text
POST http://<EXTERNAL-IP>/api/v1/analyze
Content-Type: application/json

{
  "salary": 95000,
  "spending": {"rent":1500,"food":600,"subscriptions":120,"misc":400},
  "credit_cards": ["chase_freedom","amex_gold"],
  "financial_goals": ["pay off debt","build emergency fund"]
}
```

and render `plan` from the JSON response in a `<pre>` block.

---

## TL;DR

- `docker compose up` gives you local working agent with Postgres + FastAPI.
- `kubectl apply` gives you public cloud endpoint on EKS with no GPUs.
- `ingest-job` simulates NVIDIA embedding + vector DB and proves the RAG story.
- `SIM_MODE=true` lets you demo the full "agentic" experience even without GPU quota.