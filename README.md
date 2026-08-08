# ForgeAI — AI Workflow Orchestration Platform

ForgeAI is a full-stack AI workflow orchestration platform that decomposes any user goal into a multi-agent execution pipeline — planning, parallel research, writing, verification, and human approval — with real-time visual feedback. Built for the **Advanced Agentic Systems Challenge (AE-03)**.

## How It Works

1. **User enters a goal** — e.g. _"Create a detailed birthday plan for a 30th birthday in NYC"_
2. **Planner agent** decomposes the goal into a structured task graph
3. **Researcher agents** (A & B) execute in parallel, gathering relevant information
4. **Writer agent** synthesizes research into a comprehensive deliverable
5. **Verifier agent** reviews for accuracy and completeness
6. **Human approval gate** lets the user review before finalization
7. **Final output** is rendered and exportable as Markdown or PDF

The entire pipeline streams progress via Server-Sent Events, with every node transition animated on an interactive graph canvas.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                │
│  React Flow canvas · SSE stream · Export panel      │
│  Port 3000                                          │
└──────────────────────┬──────────────────────────────┘
                       │ REST + SSE
┌──────────────────────▼──────────────────────────────┐
│                 Backend (FastAPI)                    │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ API v1  │  │ Services │  │  LangGraph Engine  │  │
│  │ Routes  │──│ Bus/Exec │──│  StateGraph with   │  │
│  │         │  │ Export   │  │  fan-out/fan-in    │  │
│  └─────────┘  └──────────┘  └───────────────────┘  │
│                                      │              │
│  ┌──────────────┐  ┌────────────────▼───────────┐  │
│  │  SQLAlchemy   │  │  Google Gemini 3.5 Flash   │  │
│  │  + aiosqlite  │  │  via langchain-google-genai│  │
│  └──────────────┘  └───────────────────────────┘  │
│  Port 8000                                          │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Python 3.10+** with **FastAPI** and async throughout
- **LangGraph** — StateGraph with parallel fan-out, conditional edges, human-in-the-loop interrupts, and checkpointing
- **Google Gemini 3.5 Flash** via `langchain-google-genai` (provider-agnostic design supports future OpenAI/Anthropic swap)
- **SQLAlchemy 2.x** + **aiosqlite** with Alembic migrations
- **SSE (Server-Sent Events)** via `sse-starlette` for real-time execution streaming
- **Pydantic v2** for all request/response validation

### Frontend
- **Next.js 15** with App Router and TypeScript
- **React Flow** for interactive workflow graph visualization
- **Framer Motion** for animations and transitions
- **Tailwind CSS** for styling

## Project Structure

```
CodeRush2.0_ZENITH/
├── backend/
│   ├── app/
│   │   ├── ai/                  # LLM providers & prompt templates
│   │   │   ├── base.py          # Abstract BaseLLMProvider
│   │   │   ├── gemini.py        # Gemini provider implementation
│   │   │   ├── registry.py      # Provider registry (multi-provider ready)
│   │   │   └── prompts/         # System/user prompts per agent role
│   │   ├── api/
│   │   │   ├── middleware/      # CORS, error handling, rate limiting, request IDs
│   │   │   └── v1/             # Versioned REST endpoints
│   │   │       ├── runs.py      # POST /run, GET /stream/{id}
│   │   │       ├── exports.py   # GET /export/{id}
│   │   │       ├── approvals.py # POST /approve/{id}
│   │   │       ├── workflows.py # Workflow CRUD
│   │   │       ├── replay.py    # Execution replay
│   │   │       └── health.py    # Health + readiness checks
│   │   ├── db/
│   │   │   ├── models/         # SQLAlchemy ORM models
│   │   │   └── repositories/   # Data access layer
│   │   ├── engine/
│   │   │   ├── graph_builder.py # LangGraph StateGraph assembly
│   │   │   ├── state.py        # ForgeState TypedDict with reducers
│   │   │   ├── edges.py        # Conditional routing logic
│   │   │   ├── checkpointer.py # AsyncSqliteSaver wrapper
│   │   │   └── nodes/          # Individual agent nodes
│   │   │       ├── planner.py
│   │   │       ├── researcher.py  # Parallel A/B researchers
│   │   │       ├── writer.py
│   │   │       ├── verifier.py
│   │   │       ├── approval.py
│   │   │       ├── join.py        # Fan-in merge node
│   │   │       └── final_output.py
│   │   ├── services/
│   │   │   ├── execution_service.py  # Core orchestrator
│   │   │   ├── event_bus.py          # In-process async event bus
│   │   │   ├── export_service.py     # Markdown/PDF export generation
│   │   │   └── ...
│   │   ├── schemas/            # Pydantic request/response models
│   │   ├── utils/              # Logging, serialization, timing
│   │   ├── config.py           # Pydantic-settings configuration
│   │   └── main.py             # FastAPI application entry point
│   ├── alembic/                # Database migrations
│   ├── pyproject.toml
│   └── .env                    # Environment variables (not committed)
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Landing page with functional chat bar
│   │   ├── workspace/page.tsx  # Main workspace with graph canvas
│   │   └── dashboard/          # Execution history dashboard
│   ├── components/
│   │   ├── agent/              # Execution monitor, export panel, approval gate
│   │   ├── flow/               # React Flow canvas, custom nodes, controls
│   │   ├── layout/             # Header, sidebar
│   │   └── ui/                 # Shared UI primitives
│   ├── hooks/                  # useExecution, useGraphGeneration, useReplay
│   └── types/                  # TypeScript type definitions
├── docker-compose.yml
├── start.bat                   # One-click Windows launcher
└── README.md
```

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd CodeRush2.0_ZENITH
   ```

2. **Configure the API key**
   ```bash
   # backend/.env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

3. **Start both servers** (Windows)
   ```bash
   start.bat
   ```

   Or manually:

   ```bash
   # Terminal 1 — Backend
   cd backend
   pip install -e .
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # Terminal 2 — Frontend
   cd frontend
   npm install
   npm run dev
   ```

4. **Open the app** at [http://localhost:3000](http://localhost:3000)

### Docker

```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/run` | Start a new workflow execution |
| `GET` | `/api/v1/stream/{execution_id}` | SSE stream of execution events |
| `POST` | `/api/v1/approve/{execution_id}` | Submit human approval decision |
| `GET` | `/api/v1/export/{execution_id}` | Export execution result |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/ready` | Readiness check |
| `GET` | `/docs` | OpenAPI documentation |

## Key Features

**Multi-Agent Pipeline** — Goal decomposition into specialized agent roles (planner, researchers, writer, verifier) with automatic orchestration.

**Parallel Execution** — Researcher agents A and B run concurrently via LangGraph's fan-out/fan-in pattern, reducing total execution time.

**Human-in-the-Loop** — Configurable approval gate with `interrupt_before` checkpointing. Auto-approves after 120s timeout if no response.

**Real-Time Streaming** — Server-Sent Events push node transitions, progress updates, and agent outputs to the frontend as they happen.

**Interactive Graph Canvas** — React Flow visualization with animated node states, edge highlights, and click-to-inspect agent configuration.

**Export** — Download the final AI-generated deliverable as Markdown or open a styled print-preview for PDF export.

**Execution Replay** — Re-watch any past execution step by step from persisted state.

**Provider-Agnostic AI Layer** — Abstract `BaseLLMProvider` with a registry pattern. Gemini is the default; OpenAI/Anthropic can be added without touching business logic.

## Configuration

All configuration is via environment variables (or `backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | — | Google Gemini API key (required) |
| `DEFAULT_MODEL` | `gemini-3.5-flash` | Gemini model to use |
| `DEFAULT_TEMPERATURE` | `0.7` | LLM temperature |
| `DEFAULT_MAX_TOKENS` | `8192` | Max output tokens |
| `DATABASE_URL` | `sqlite+aiosqlite:///data/forgeai.db` | Database connection string |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging level |

## Hackathon Context

**Challenge:** Advanced Agentic Systems (AE-03) — Unified Agent Workflow Orchestrator

**Problem Statement:** Build a platform that orchestrates multiple AI agents through complex, multi-step workflows with real-time observability, human oversight, and exportable deliverables.

**Approach:** Rather than a simple chain, ForgeAI implements a true directed acyclic graph with parallel branches, state reducers for conflict-free merges, checkpoint-based interrupts for human approval, and streaming observability — demonstrating production-grade agentic system design.

## License

MIT
