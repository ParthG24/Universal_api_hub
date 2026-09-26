# Universal AI API Connector & Hub

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://universal-api-owb68btc4-squeak2.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/ParthG24/Universal_api_hub)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg?style=flat&logo=github)](https://github.com/ParthG24/Universal_api_hub/releases/tag/v1.0.0)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg?style=flat&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> 🚀 **Live Production Deployment:** [https://universal-api-owb68btc4-squeak2.vercel.app/](https://universal-api-owb68btc4-squeak2.vercel.app/)

A production-style developer platform where administrators can define, deploy, test, document, and monitor reusable AI-powered API endpoints ("connectors") without writing custom code for each one. Built with a unified **Provider Adapter Architecture** supporting **Google Gemini** (multimodal vision + text), **Groq** (high-speed Llama models), and **OpenAI**, featuring an interactive dynamic test console, automatic JSON schema repair, and persistent token/cost observability styled in the **minimalist aesthetic**.

---

## 1. Tech Stack Overview

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | **Next.js 14+ (App Router, TypeScript)** | Styled with Tailwind CSS in SurgeDB neo-brutalist aesthetic (`#DE6E4B` accents, hard offset shadows, monospace code consoles). |
| **Backend** | **FastAPI (Python 3.11+)** | Pydantic v2 strict schemas, async `httpx` provider adapters, global standardized error envelopes. |
| **Database & ORM** | **PostgreSQL / SQLite via SQLAlchemy 2.0** | Hosted Neon PostgreSQL with connection pooling; Alembic database migrations. |
| **AI Providers** | **Gemini, Groq, OpenAI, Ollama** | Pluggable `AIProvider` adapter abstraction with model pricing, token calculation, and local offline inference via Ollama. |
| **Security** | **JWT + Hashed API Keys** | Bcrypt admin authentication, SHA-256 hashed connector keys, strict input validation, secret isolation. |

---

## 2. Live Demo Deployment URLs

| Service | Target URL | Notes |
|---|---|---|
| **Web Dashboard (Live)** | [https://universal-api-owb68btc4-squeak2.vercel.app/](https://universal-api-owb68btc4-squeak2.vercel.app/) | Live production UI hosted on Vercel Edge CDN. |
| **FastAPI Backend (Live)** | `https://universal-hub-api.onrender.com` | Live REST API hosted on Render with Neon PostgreSQL. |
| **Public API Reference** | [/connectors/card-scanner/docs](https://universal-api-owb68btc4-squeak2.vercel.app/connectors/card-scanner/docs) | Auto-generated interactive API reference with cURL, Python & JS snippets. |
| **User & Architecture Guide** | [/guide](https://universal-api-owb68btc4-squeak2.vercel.app/guide) | Step-by-step evaluator walkthrough and mechanics. |

> **Evaluation Credentials:**
> - **Admin Email:** `admin@universalhub.dev`
> - **Admin Password:** `Admin123!`
> - *(Or click the "Fill Demo" button on `/login` for 1-click evaluation access).*

---

## 3. Pre-Seeded Demonstration Connectors (100% Free Tiers)

The platform comes pre-seeded with three fully functional demonstration connectors running exclusively on zero-cost, high-reliability free tiers:

### Connector A — Business Card Scanner (`card-scanner`)
- **Engine:** Google Gemini (`gemini-3.8-flash` / `gemini-3.5-flash-lite` - Free Tier)
- **Type:** Multimodal Vision → Structured JSON
- **Inputs:** `image` (binary file / photo, required)
- **Output Schema:** `{ "name": "string", "company": "string", "designation": "string", "phone": "string", "email": "string", "website": "string" }`
- **Pre-Seeded API Key:** `uah_card_demo_key_2026_xyz987`

### Connector B — Content Rewriter (`content-rewriter`)
- **Engine:** Groq (`llama-3.1-8b-instant` - 100% Free Tier, 30 RPM, 14,400 RPD)
- **Type:** High-Speed Text Inference → Structured JSON
- **Inputs:** `text` (required), `tone` (optional, default `"professional"`), `word_count` (optional number)
- **Output Schema:** `{ "rewritten_text": "string", "word_count": "number" }`
- **Pre-Seeded API Key:** `uah_rewrite_demo_key_2026_abc123`

### Connector C — Sentiment Analyzer (`sentiment-analyzer`)
- **Engine:** Groq (`llama-3.1-8b-instant` - 100% Free Tier, ~180ms latency)
- **Type:** Customer Feedback & Emotion Analysis → Structured JSON
- **Inputs:** `text` (required), `domain` (optional, default `"general"`)
- **Output Schema:** `{ "sentiment": "string", "score": "number", "emotional_tone": "string", "key_drivers": "array", "summary": "string" }`
- **Pre-Seeded API Key:** `uah_sentiment_demo_key_2026_sen456`

---

## 4. Local Setup & Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/universal-ai-hub.git
cd universal-ai-hub
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root and backend directories:
```bash
cp .env.example backend/.env
```
Add your free AI provider keys:
- `GEMINI_API_KEY`: Get a free key from [Google AI Studio](https://aistudio.google.com/)
- `GROQ_API_KEY`: Get an ultra-fast free key from [Groq Console](https://console.groq.com/)
- `OPENAI_API_KEY`: *(Optional)* from [OpenAI Platform](https://platform.openai.com/)

### Step 3: Install & Start Backend
```bash
cd backend

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed default admin, demo connectors, and sample request logs
python -m app.seed

# Run the FastAPI server on port 8000
python -m uvicorn app.main:app --port 8000 --reload
```
The backend is now live at `http://127.0.0.1:8000`. You can inspect the health check at `http://127.0.0.1:8000/api/health`.

### Step 4: Install & Start Frontend
In a new terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Running Automated Backend Tests

The backend includes a comprehensive `pytest` test suite covering input validation, injection-resistant prompt construction, JSON schema auto-repair, admin authentication, and the dynamic invocation pipeline:

```bash
cd backend
python -m pytest tests -v
```
All 18 test cases pass out of the box with zero warnings (including Ollama offline adapter tests).

---

## 6. How to Call a Connector from External Applications

Every connector has a real, callable REST endpoint: `POST /api/connectors/{slug}/invoke`.

### Example 1: cURL (Content Rewriter)
```bash
curl -X POST "http://localhost:8000/api/connectors/content-rewriter/invoke" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: uah_rewrite_demo_key_2026_abc123" \
  -d '{
    "text": "Universal AI Hub transforms prompts into production-grade APIs.",
    "tone": "enthusiastic",
    "word_count": 20
  }'
```

**Standardized Response Envelope:**
```json
{
  "success": true,
  "data": {
    "rewritten_text": "Supercharged prompts meet production-grade APIs with Universal AI Hub!",
    "word_count": 10
  },
  "error": null,
  "meta": {
    "latency_ms": 182.4,
    "tokens": 128,
    "estimated_cost": 0.000019,
    "provider": "groq",
    "model": "llama-3.1-8b-instant"
  }
}
```

### Example 2: cURL with Multipart Image (Card Scanner)
```bash
curl -X POST "http://localhost:8000/api/connectors/card-scanner/invoke" \
  -H "X-API-Key: uah_card_demo_key_2026_xyz987" \
  -F "image=@/path/to/business_card.png"
```

### Example 3: cURL (Sentiment Analyzer)
```bash
curl -X POST "http://localhost:8000/api/connectors/sentiment-analyzer/invoke" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: uah_sentiment_demo_key_2026_sen456" \
  -d '{
    "text": "The platform was exceptionally responsive and solved our problem immediately!",
    "domain": "customer_support"
  }'
```

### Example 4: Python (`requests`)
```python
import requests

url = "http://localhost:8000/api/connectors/content-rewriter/invoke"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "uah_rewrite_demo_key_2026_abc123"
}
payload = {
    "text": "Meeting scheduled for 3 PM.",
    "tone": "formal"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

---

## 7. How to Create a New Connector Through the UI

1. Open `http://localhost:3000/dashboard` and click **"+ Create Connector"** (or navigate to `/connectors/new`).
2. **Step 1: Basics** — Enter a friendly Name, unique URL slug (e.g. `invoice-parser`), and Description.
3. **Step 2: Model Selection** — Pick your AI Provider (Google Gemini, Groq, or OpenAI) and select a model. Click *"Refresh Provider Models"* to pull live models dynamically from the provider API.
4. **Step 3: Prompt** — Define your System Instructions.
5. **Step 4: Dynamic Inputs** — Add parameters using the repeatable-row builder:
   - Types supported: `Text`, `Number`, `Boolean`, `Image (Upload)`, `File (Upload)`, and `JSON`.
   - Set required flags, default values, and constraints.
6. **Step 5: Output Schema** — Specify the target JSON schema.
7. **Step 6: Review & Deploy** — Click Create. Your secret API key is generated and shown once with a copy button.

---

## 8. Environment Variable Reference

| Variable | Description | Required | Default |
|---|---|---|---|
| `DATABASE_URL` | SQLAlchemy database connection URI (SQLite or PostgreSQL) | Yes | `sqlite:///./universal_hub.db` |
| `SECRET_KEY` | HMAC secret for signing JWT admin tokens | Yes | Built-in default for dev |
| `GEMINI_API_KEY` | Google Gemini API key for vision and text models | Optional* | `""` |
| `GROQ_API_KEY` | Groq API key for LPU text inference | Optional* | `""` |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o models | Optional | `""` |
| `ADMIN_EMAIL` | Administrator login email address | Yes | `admin@universalhub.dev` |
| `ADMIN_PASSWORD` | Administrator password | Yes | `Admin123!` |
| `CORS_ORIGINS` | JSON list of allowed origins for browser access | Yes | `["http://localhost:3000"]` |
| `NEXT_PUBLIC_API_URL` | Base URL of FastAPI backend for Next.js frontend | Yes | `http://localhost:8000` |

*\* At least one provider key is recommended to run live AI invocations; mock test suites run independently without external keys.*

---

## 9. Implemented Bonus Features

- **Live Model Discovery & Refresh:** `POST /api/admin/providers/{name}/refresh-models` actively queries AI providers and caches live available models.
- **Third Provider Integration (OpenAI):** Full adapter implementation for OpenAI GPT-4o and GPT-4o-mini alongside Gemini and Groq.
- **Interactive Multi-Language Documentation:** Auto-generated interactive snippets in cURL, Python (`requests`), and JavaScript (`fetch`) that adapt to multipart or JSON content types.
- **Fail-Safe Observability:** Try/except isolated database writes ensure telemetry issues never break client API responses.
- **One-Click Sample Card Generation:** Test Console includes an in-browser canvas generator to create and test synthetic business card images on demand.
- **SurgeDB Neo-Brutalist Theme:** Handcrafted UI matching `https://surgedb.chipling.xyz/` with high-contrast borders, terracotta accents (`#DE6E4B`), and offset drop shadows.

---

## 10. Known Limitations

- **Free Tier Cold Starts:** When deployed to free tiers (e.g. Render Web Services), the backend container may sleep after 15 minutes of inactivity, causing the initial request to take ~20-30 seconds to wake up.
- **Provider Rate Limits:** Free-tier keys on Groq and Gemini have per-minute rate limits enforced by the vendors.

---

## 11. Additional Deliverables

For an in-depth, plain-language narrative walkthrough of the system architecture, security model, and request lifecycles, refer to:
📄 **[`HOW_IT_WORKS.txt`](./HOW_IT_WORKS.txt)**
