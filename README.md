# 🧠 Agentic Personal Finance Assistant

**An AI-driven financial planning assistant powered by NVIDIA NIM, AWS EKS, and pgvector — built to reason like a real financial advisor.**

> 💰 *Manage your money smarter.*  
> Input your salary, expenses, and credit cards — the app analyzes your spending, retrieves credit card benefits, and uses LLM reasoning to generate personalized financial advice.

---

## 🚀 Overview
This project was built for the **[NVIDIA × AWS Hackathon](https://nvidia-aws.devpost.com/)**.  
It demonstrates an **Agentic Application** running on **NVIDIA NIM microservices** deployed in **Amazon EKS**, with:

- **Reasoning LLM** – `llama-3.1-nemotron-nano-8B-v1`
- **Retrieval Embedding NIM** – `nv-embedqa-e5-v5`
- **Vector Search** – PostgreSQL with `pgvector`
- **Frontend** – Angular web interface
- **Backend** – FastAPI Orchestrator handling reasoning, retrieval, and response synthesis

---

## 🧩 System Architecture

| Layer | Technology | Role |
|-------|-------------|------|
| **Frontend** | Angular | Collects user inputs, displays personalized insights |
| **Backend** | FastAPI Orchestrator | Coordinates embedding, retrieval, and LLM reasoning |
| **LLM Microservices** | NVIDIA NIM (Nemotron 8B) | Generates reasoning and financial recommendations |
| **Embeddings Service** | NVIDIA NIM (E5-v5) | Creates dense embeddings for similarity search |
| **Database** | PostgreSQL + pgvector | Stores financial KB and user context |
| **Infrastructure** | AWS EKS | Container orchestration and scalability |
| **Storage** | S3 | Knowledge base and exports |
| **Observability** | Prometheus / Grafana | Metrics and monitoring |

---

## ⚙️ Features

- 🧠 **Agentic reasoning** using LLM prompts and financial context  
- 💳 **Credit card optimization**: identifies which card to use for each category  
- 📊 **Budget analysis**: personalized spending breakdown  
- 🔎 **Retrieval-Augmented Generation (RAG)** pipeline for grounded responses  
- 🧰 **Local-first development** via Docker Compose  
- ☁️ **Cloud-ready** deployment with NVIDIA NIM microservices on AWS EKS  

---

## 🧱 Project Structure

```
agentic-finance/
├─ docker/              # Docker Compose setup
├─ orchestrator/        # FastAPI app (orchestration, reasoning)
├─ data/                # DB schema & embedding scripts
├─ frontend/            # Angular UI (to be added)
└─ helm/                # AWS EKS deployment (later phase)
```

---

## 🧑‍💻 Local Development

You can develop and test **everything locally** — no AWS cost.

```bash
cd docker
docker compose up --build
```

Then visit:
- Backend: [http://localhost:5000/docs](http://localhost:5000/docs)
- Database: localhost:5432  
- Angular UI: [http://localhost:4200](http://localhost:4200) *(after Phase 3)*

---

## ☁️ Cloud Deployment (later phase)

When ready for cloud testing:
1. Deploy NIM microservices on **AWS EKS GPU node**  
2. Push orchestrator image to **ECR**  
3. Point frontend to your API’s ALB domain  
4. Configure IAM + Secrets Manager for secure access  

---

## 🧭 Tech Stack

| Type | Technology |
|------|-------------|
| LLMs | NVIDIA NIM – Nemotron 8B, Embedding E5-v5 |
| Backend | FastAPI (Python) |
| Frontend | Angular (TypeScript) |
| Vector Store | PostgreSQL + pgvector |
| Infra | Amazon EKS, NVIDIA GPU Nodes |
| Observability | Prometheus, Grafana |
| Deployment | Docker, Helm, GitHub Actions (optional) |

---

## 🧪 Quick Demo (Local)

```bash
curl -X POST http://localhost:5000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
        "salary": 100000,
        "spending": {"groceries": 500, "dining": 300},
        "credit_cards": [{"name":"Amex Gold"}, {"name":"Chase Freedom"}],
        "financial_goals": ["save_for_vacation"]
      }'
```

Response:

```json
{
  "plan": {
    "budget": {"essentials": 0.5, "wants": 0.2, "savings": 0.3},
    "cards": {"groceries": "Chase Freedom", "dining": "Amex Gold"},
    "actions": ["Set up $500 auto-savings"],
    "explain": "Stubbed plan; full reasoning runs on NIM."
  }
}
```

---




