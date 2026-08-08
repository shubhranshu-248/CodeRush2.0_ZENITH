# Nexora Backend — Architecture Document

> **Status**: PENDING APPROVAL  
> **Author**: Principal Software Architect  
> **Date**: 2026-08-07  
> **Stack**: Python 3.12 · FastAPI · LangGraph 1.2 · LangChain · Gemini 2.5 Flash · SQLAlchemy 2.x · SQLite · Alembic

---

## 1. Frontend API Contract (Source of Truth)

The existing Next.js frontend expects the following endpoints on `http://localhost:8000`:

### 1.1 REST Endpoints

| Method | Path | Request Body | Response | Purpose |
|--------|------|-------------|----------|---------|
| `POST` | `/api/v1/workflow/generate` | `{ goal: string, options?: {} }` | `Workflow` object | Parse natural-language goal → workflow DAG |
| `POST` | `/api/v1/run` | `{ goal: string, options?: {} }` | `{ id, run_id, status, state_snapshot }` | Start full execution (generate + execute) |
| `GET` | `/api/v1/runs/{id}` | — | `RunResponse` | Get current run state |
| `GET` | `/api/v1/runs` | — | `RunSummary[]` | List all runs (dashboard) |
| `POST` | `/api/v1/approve` | `{ run_id, approved: bool, feedback? }` | `RunResponse` | Submit human approval decision |
| `GET` | `/api/v1/replay/{id}/timeline` | — | `ExecutionEvent[]` | Get replay timeline for a past execution |
| `POST` | `/api/v1/export` | `{ run_id, format: "MARKDOWN"\|"PDF" }` | Export payload | Export execution result |
| `POST` | `/api/v1/agent/config` | `{ agent_type, model, temperature }` | `{ ok: true }` | Persist per-agent model/temperature override |
| `GET` | `/api/v1/health` | — | `{ status, version, uptime }` | Health check |

### 1.2 Server-Sent Events (SSE)

| Path | Event Names | Purpose |
|------|-------------|---------|
| `GET /api/v1/runs/{id}/events?stream=true` | `EXECUTION_STARTED`, `STEP_STARTED`, `STEP_COMPLETED`, `STEP_FAILED`, `APPROVAL_REQUIRED`, `APPROVAL_SUBMITTED`, `EXECUTION_COMPLETED`, `WORKFLOW_CREATED` | Real-time execution streaming |

### 1.3 SSE Event Payload Shape (DomainEvent)

```json
{
  "event_type": "STEP_COMPLETED",
  "execution_id": "uuid",
  "data": {
    "node_id": "planner",
    "agent_type": "planner",
    "step_number": 1,
    "inputs": {},
    "outputs": {},
    "tokens_used": 2800,
    "cost": 0.018
  },
  "timestamp": "ISO-8601",
  "error": null
}
```

### 1.4 Frontend Type Expectations

**Workflow**: `{ id, goal, graphData: { nodes: FlowNode[], edges: FlowEdge[] }, status, createdAt, updatedAt }`

**FlowNode**: `{ id, type: "agentNode", position: {x,y}, data: { label, agentType, config?, status?, duration?, error? } }`

**AgentType**: `"planner" | "researcher" | "parallel_research" | "writer" | "verifier" | "join" | "approval" | "final_output"`

**RunSummary** (dashboard): `{ id, goal, status, agent_count, duration_ms, cost, created_at }`

---

## 2. Folder Structure

```
backend/
├── alembic/                        # Database migrations
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application factory
│   ├── config.py                   # Settings via pydantic-settings
│   ├── dependencies.py             # Dependency injection providers
│   │
│   ├── api/                        # API layer (routes only, no business logic)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py           # Aggregated v1 router
│   │   │   ├── workflows.py        # POST /workflow/generate
│   │   │   ├── runs.py             # POST /run, GET /runs, GET /runs/{id}
│   │   │   ├── approvals.py        # POST /approve
│   │   │   ├── replay.py           # GET /replay/{id}/timeline
│   │   │   ├── exports.py          # POST /export
│   │   │   ├── agents.py           # POST /agent/config
│   │   │   └── health.py           # GET /health
│   │   └── middleware/
│   │       ├── __init__.py
│   │       ├── cors.py
│   │       ├── error_handler.py    # Centralized exception handler
│   │       ├── request_id.py       # X-Request-ID injection
│   │       └── rate_limiter.py     # In-memory rate limiting
│   │
│   ├── schemas/                    # Pydantic v2 request/response models
│   │   ├── __init__.py
│   │   ├── workflow.py             # Workflow, FlowNode, FlowEdge, etc.
│   │   ├── run.py                  # RunRequest, RunResponse, RunSummary
│   │   ├── approval.py             # ApprovalRequest, ApprovalResponse
│   │   ├── export.py               # ExportRequest, ExportResponse
│   │   ├── events.py               # DomainEvent, EventType enum
│   │   ├── health.py               # HealthResponse
│   │   └── common.py               # ApiResponse[T], ErrorResponse, Pagination
│   │
│   ├── services/                   # Business logic layer
│   │   ├── __init__.py
│   │   ├── workflow_service.py     # Workflow generation orchestration
│   │   ├── execution_service.py    # Run lifecycle management
│   │   ├── approval_service.py     # Approval state machine
│   │   ├── replay_service.py       # Replay timeline construction
│   │   ├── export_service.py       # Export rendering (MD, PDF)
│   │   └── event_bus.py            # In-process async event bus (SSE bridge)
│   │
│   ├── engine/                     # LangGraph orchestration engine
│   │   ├── __init__.py
│   │   ├── graph_builder.py        # Builds the LangGraph StateGraph
│   │   ├── state.py                # TypedDict for graph state
│   │   ├── nodes/                  # One module per agent node
│   │   │   ├── __init__.py
│   │   │   ├── planner.py          # Planner agent node
│   │   │   ├── researcher.py       # Research agent node (parallel-capable)
│   │   │   ├── join.py             # Fan-in join node
│   │   │   ├── writer.py           # Writer agent node
│   │   │   ├── verifier.py         # Verifier agent node
│   │   │   ├── approval.py         # Human approval interrupt node
│   │   │   └── final_output.py     # Final output aggregator
│   │   ├── edges.py                # Conditional edge functions
│   │   └── checkpointer.py         # SQLite checkpointer setup
│   │
│   ├── ai/                         # Provider-agnostic AI abstraction
│   │   ├── __init__.py
│   │   ├── base.py                 # Abstract LLM provider interface
│   │   ├── gemini.py               # Google Gemini implementation (ChatGoogleGenerativeAI)
│   │   ├── registry.py             # Provider registry + factory
│   │   └── prompts/                # Prompt templates per agent
│   │       ├── __init__.py
│   │       ├── planner.py
│   │       ├── researcher.py
│   │       ├── writer.py
│   │       └── verifier.py
│   │
│   ├── db/                         # Database layer
│   │   ├── __init__.py
│   │   ├── engine.py               # SQLAlchemy engine + session factory
│   │   ├── models/                 # ORM models
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Declarative base + mixins
│   │   │   ├── workflow.py         # Workflow model
│   │   │   ├── execution.py        # Execution model
│   │   │   ├── step_log.py         # StepLog model
│   │   │   ├── approval.py         # Approval model
│   │   │   └── export.py           # Export record model
│   │   └── repositories/           # Repository pattern
│   │       ├── __init__.py
│   │       ├── base.py             # Generic async repository
│   │       ├── workflow_repo.py
│   │       ├── execution_repo.py
│   │       ├── step_log_repo.py
│   │       └── approval_repo.py
│   │
│   └── utils/                      # Cross-cutting utilities
│       ├── __init__.py
│       ├── logging.py              # Loguru configuration
│       ├── timing.py               # Execution timing decorator
│       └── serialization.py        # orjson helpers
│
├── tests/                          # Test suite (mirrors app/ structure)
│   ├── conftest.py
│   ├── test_api/
│   ├── test_services/
│   ├── test_engine/
│   └── test_ai/
│
├── .env.example                    # Environment variable template
├── pyproject.toml                  # Project metadata + dependencies
├── Dockerfile                      # Production container
├── docker-compose.yml              # Local development
└── README.md
```

---

## 3. Module Responsibilities

### 3.1 `app/api/` — Transport Layer
Routes only. Each route function validates input via Pydantic schema, calls the corresponding service, and returns a Pydantic response model. Zero business logic.

### 3.2 `app/schemas/` — Data Contracts
All Pydantic v2 models with `model_config = ConfigDict(from_attributes=True)` for ORM compatibility. Strict validation, proper field aliases (`alias_generator=to_camel` where needed for frontend snake_case expectations — the frontend actually uses snake_case, so we match that).

### 3.3 `app/services/` — Business Logic
Orchestrates between repositories, the LangGraph engine, and the event bus. Services are stateless classes injected via FastAPI's `Depends()`.

### 3.4 `app/engine/` — LangGraph Orchestration
The heart of Nexora. Builds and compiles a `StateGraph`, defines nodes and edges, manages checkpointing and human-in-the-loop interrupts. Each node module is a self-contained async function that receives state and returns state updates.

### 3.5 `app/ai/` — Provider Abstraction
A `BaseLLMProvider` abstract class with a single concrete implementation (`GeminiProvider`) using `langchain-google-genai`'s `ChatGoogleGenerativeAI`. The `ProviderRegistry` selects providers by name, enabling future OpenAI/Anthropic support with zero changes to business logic.

### 3.6 `app/db/` — Persistence
SQLAlchemy 2.x async ORM with the repository pattern. Each repository provides CRUD + domain-specific queries. The `engine.py` module creates the async engine and session factory, designed for drop-in PostgreSQL migration (change DSN only).

### 3.7 `app/api/middleware/` — Cross-cutting Concerns
Request ID injection, CORS, centralized error handling (maps domain exceptions to HTTP status codes), and token-bucket rate limiting.

---

## 4. Database Schema

### 4.1 Entity-Relationship Model

```
workflows ──< executions ──< step_logs
                │
                └──< approvals
                │
                └──< exports
```

### 4.2 Table Definitions

#### `workflows`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` (UUID) | PK |
| `goal` | `TEXT` | NOT NULL |
| `graph_data` | `JSON` | NOT NULL — serialized `{ nodes, edges }` |
| `status` | `TEXT` | `DRAFT`, `COMPILED`, `EXECUTING`, `COMPLETED` |
| `created_at` | `DATETIME` | DEFAULT NOW |
| `updated_at` | `DATETIME` | ON UPDATE NOW |

#### `executions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` (UUID) | PK |
| `workflow_id` | `TEXT` | FK → workflows.id |
| `run_id` | `TEXT` (UUID) | Unique run identifier |
| `status` | `TEXT` | `PENDING`, `RUNNING`, `WAITING_APPROVAL`, `APPROVED`, `REJECTED`, `COMPLETED`, `FAILED` |
| `state_snapshot` | `JSON` | LangGraph state at last checkpoint |
| `error` | `TEXT` | NULL unless FAILED |
| `agent_count` | `INTEGER` | Number of agents in the pipeline |
| `duration_ms` | `INTEGER` | Total execution time |
| `cost` | `REAL` | Accumulated cost |
| `total_tokens` | `INTEGER` | Accumulated token usage |
| `created_at` | `DATETIME` | DEFAULT NOW |
| `completed_at` | `DATETIME` | NULL until finished |

#### `step_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` (UUID) | PK |
| `execution_id` | `TEXT` | FK → executions.id |
| `node_id` | `TEXT` | LangGraph node name |
| `agent_type` | `TEXT` | Agent type enum value |
| `status` | `TEXT` | `running`, `completed`, `failed` |
| `step_number` | `INTEGER` | Ordered position |
| `inputs` | `JSON` | Agent input data |
| `outputs` | `JSON` | Agent output data |
| `tokens_used` | `INTEGER` | Tokens consumed by this step |
| `cost` | `REAL` | Cost of this step |
| `duration_ms` | `INTEGER` | Step execution time |
| `error` | `TEXT` | NULL unless failed |
| `timestamp` | `DATETIME` | DEFAULT NOW |

#### `approvals`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` (UUID) | PK |
| `execution_id` | `TEXT` | FK → executions.id |
| `approved` | `BOOLEAN` | NULL until decision |
| `feedback` | `TEXT` | Optional reviewer feedback |
| `requested_at` | `DATETIME` | When approval was requested |
| `decided_at` | `DATETIME` | When decision was made |

#### `exports`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `TEXT` (UUID) | PK |
| `execution_id` | `TEXT` | FK → executions.id |
| `format` | `TEXT` | `MARKDOWN`, `PDF`, `JSON`, `TEXT` |
| `content` | `TEXT` | Rendered export content |
| `created_at` | `DATETIME` | DEFAULT NOW |

---

## 5. LangGraph Architecture

### 5.1 Graph Topology

```
                    ┌─────────┐
                    │ PLANNER │
                    └────┬────┘
                         │
                    ┌────┴────┐
              ┌─────┤  SPLIT  ├─────┐
              │     └─────────┘     │
        ┌─────▼─────┐        ┌─────▼─────┐
        │RESEARCHER A│        │RESEARCHER B│
        └─────┬─────┘        └─────┬─────┘
              │     ┌─────────┐     │
              └─────┤  JOIN   ├─────┘
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ WRITER  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │VERIFIER │
                    └────┬────┘
                         │
                    ┌────▼─────┐
                    │ APPROVAL │  ← human interrupt
                    └────┬─────┘
                         │
                  ┌──────▼───────┐
                  │ FINAL_OUTPUT │
                  └──────────────┘
```

### 5.2 State Definition

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class ForgeState(TypedDict):
    goal: str
    plan: dict                          # Planner output
    research_results: list[dict]        # Aggregated from parallel researchers
    draft: str                          # Writer output
    verification: dict                  # Verifier output
    final_output: str                   # Final aggregated result
    approval_status: str | None         # "approved" | "rejected" | None
    approval_feedback: str | None
    current_step: int
    errors: list[str]
    metadata: dict                      # tokens, cost, timing
```

### 5.3 Graph Construction

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

builder = StateGraph(ForgeState)

# Add nodes
builder.add_node("planner", planner_node)
builder.add_node("researcher_a", researcher_node)
builder.add_node("researcher_b", researcher_node)
builder.add_node("join", join_node)
builder.add_node("writer", writer_node)
builder.add_node("verifier", verifier_node)
builder.add_node("approval", approval_node)
builder.add_node("final_output", final_output_node)

# Set entry
builder.set_entry_point("planner")

# Edges
builder.add_edge("planner", "researcher_a")   # Fan-out via Send()
builder.add_edge("planner", "researcher_b")
builder.add_edge("researcher_a", "join")
builder.add_edge("researcher_b", "join")
builder.add_edge("join", "writer")
builder.add_edge("writer", "verifier")
builder.add_conditional_edges("verifier", route_after_verification)
builder.add_edge("approval", "final_output")
builder.add_edge("final_output", END)

# Compile with checkpointer
checkpointer = AsyncSqliteSaver.from_conn_string("data/checkpoints.db")
graph = builder.compile(
    checkpointer=checkpointer,
    interrupt_before=["approval"]   # Human-in-the-loop
)
```

### 5.4 Parallel Research (Fan-out/Fan-in)

The planner node uses LangGraph's `Send()` API to dispatch multiple research tasks in parallel. The join node aggregates results using a reducer function on `research_results`.

### 5.5 Human-in-the-Loop

The `interrupt_before=["approval"]` configuration pauses execution before the approval node. When the user POSTs to `/api/v1/approve`, the service calls `graph.aupdate_state(thread_config, {"approval_status": "approved"})` and resumes with `graph.ainvoke(None, thread_config)`.

### 5.6 Checkpointing & Replay

Every superstep is persisted via `AsyncSqliteSaver`. Replay reconstructs the timeline by reading checkpoint history for a given thread, extracting node transitions and timestamps.

### 5.7 Event Emission

Each node function emits `DomainEvent` objects to an in-process `EventBus` (async queue). The SSE endpoint consumes from this bus and streams events to the frontend. The bus is keyed by `execution_id` so multiple concurrent executions are isolated.

---

## 6. Agent Architecture

### 6.1 Agent Node Contract

Every agent node is an async function with this signature:

```python
async def planner_node(state: ForgeState, config: RunnableConfig) -> dict:
    """Returns a partial state update dict."""
```

### 6.2 Agent Descriptions

| Agent | Input | Output | Model | Purpose |
|-------|-------|--------|-------|---------|
| **Planner** | `goal` | `plan` (structured task decomposition) | Gemini 2.5 Flash | Decomposes the user's goal into a structured execution plan |
| **Researcher** | `plan.tasks[i]` | `research_results[i]` | Gemini 2.5 Flash | Executes a specific research subtask |
| **Join** | `research_results[]` | merged `research_results` | None (logic only) | Aggregates parallel research outputs |
| **Writer** | `plan`, `research_results` | `draft` | Gemini 2.5 Flash | Synthesizes research into a coherent document |
| **Verifier** | `draft`, `plan` | `verification` (pass/fail + issues) | Gemini 2.5 Flash | Validates accuracy, completeness, consistency |
| **Approval** | `verification` | `approval_status` | None (human) | Human-in-the-loop gate |
| **Final Output** | All prior state | `final_output` | Gemini 2.5 Flash | Produces polished final deliverable |

### 6.3 AI Provider Abstraction

```python
class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str, **kwargs) -> LLMResponse: ...

    @abstractmethod
    async def generate_structured(self, prompt: str, schema: type[BaseModel], **kwargs) -> BaseModel: ...

class GeminiProvider(BaseLLMProvider):
    """Uses ChatGoogleGenerativeAI from langchain-google-genai."""
    def __init__(self, model: str = "gemini-2.5-flash", temperature: float = 0.7): ...
```

The `ProviderRegistry` maps string names to provider classes:

```python
registry = ProviderRegistry()
registry.register("gemini", GeminiProvider)
# Future:
# registry.register("openai", OpenAIProvider)
# registry.register("anthropic", AnthropicProvider)
```

---

## 7. SSE & Event System

### 7.1 Architecture

```
LangGraph Node → EventBus.publish(event) → SSE Endpoint → EventSource (frontend)
```

### 7.2 EventBus Implementation

An in-process async event bus using `asyncio.Queue` per execution:

```python
class EventBus:
    _queues: dict[str, asyncio.Queue[DomainEvent]]

    async def publish(self, execution_id: str, event: DomainEvent): ...
    async def subscribe(self, execution_id: str) -> AsyncGenerator[DomainEvent, None]: ...
    def cleanup(self, execution_id: str): ...
```

### 7.3 SSE Response Format

```
event: STEP_COMPLETED
data: {"event_type":"STEP_COMPLETED","execution_id":"...","data":{...},"timestamp":"..."}

```

Each event uses named SSE events matching the `EventType` enum so the frontend's `addEventListener` pattern works directly.

---

## 8. Error Handling Strategy

### 8.1 Exception Hierarchy

```python
class NexoraError(Exception):
    """Base exception for all Nexora errors."""
    status_code: int = 500

class NotFoundError(NexoraError):
    status_code = 404

class ValidationError(NexoraError):
    status_code = 422

class ConflictError(NexoraError):
    status_code = 409

class AIProviderError(NexoraError):
    status_code = 502

class RateLimitError(NexoraError):
    status_code = 429

class ApprovalTimeoutError(NexoraError):
    status_code = 408
```

### 8.2 Centralized Handler

A FastAPI exception handler middleware catches all `NexoraError` subclasses and returns consistent JSON:

```json
{
  "error": "Resource not found",
  "detail": "Execution run_abc123 does not exist",
  "request_id": "req_xyz789",
  "status": 404
}
```

### 8.3 Agent-Level Error Recovery

If an agent node fails (AI provider error, timeout, etc.), the error is captured in state, emitted as `STEP_FAILED`, and the execution status transitions to `FAILED`. The checkpointed state allows retry from the failed node.

---

## 9. Logging Architecture

### 9.1 Loguru Configuration

```python
from loguru import logger

logger.add(
    "logs/nexora_{time}.log",
    rotation="10 MB",
    retention="7 days",
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level:<8} | {extra[request_id]} | {name}:{function}:{line} | {message}",
    serialize=True,  # JSON structured logs
)
```

### 9.2 Log Categories

- **API**: Request/response, status codes, latency
- **Engine**: Node transitions, state changes, checkpoints
- **AI**: Provider calls, token usage, latency (never log prompt content containing secrets)
- **DB**: Query execution, connection pool stats
- **Events**: SSE connections, event delivery

### 9.3 Request ID Propagation

Every request gets a UUID via `X-Request-ID` header (middleware). This ID propagates through services, engine, and AI calls using Loguru's `bind()`.

---

## 10. Configuration Management

### 10.1 Pydantic Settings

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application
    app_name: str = "Nexora"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///data/nexora.db"

    # AI Providers
    google_api_key: str              # Required — no default
    default_model: str = "gemini-2.5-flash"
    default_temperature: float = 0.7
    default_max_tokens: int = 8192

    # LangGraph
    checkpoint_db_path: str = "data/checkpoints.db"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Rate Limiting
    rate_limit_per_minute: int = 30

    # Logging
    log_level: str = "INFO"
    log_dir: str = "logs"
```

### 10.2 `.env.example`

```env
GOOGLE_API_KEY=your-gemini-api-key-here
DATABASE_URL=sqlite+aiosqlite:///data/nexora.db
CHECKPOINT_DB_PATH=data/checkpoints.db
DEBUG=false
CORS_ORIGINS=["http://localhost:3000"]
LOG_LEVEL=INFO
DEFAULT_MODEL=gemini-2.5-flash
```

---

## 11. Dependency Injection

FastAPI's `Depends()` system wires everything together:

```python
# dependencies.py

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

def get_settings() -> Settings:
    return Settings()

def get_llm_provider(settings: Settings = Depends(get_settings)) -> BaseLLMProvider:
    return ProviderRegistry().get(settings.default_model, api_key=settings.google_api_key)

def get_workflow_service(...) -> WorkflowService: ...
def get_execution_service(...) -> ExecutionService: ...
# etc.
```

---

## 12. Deployment Architecture

### 12.1 Local Development

```
docker-compose up
# or
uvicorn app.main:create_app --factory --reload --host 0.0.0.0 --port 8000
```

### 12.2 Production (Railway / Render)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY . .
RUN alembic upgrade head
EXPOSE 8000
CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
```

### 12.3 Architecture Diagram

```
┌──────────────┐     HTTP/SSE     ┌──────────────────┐
│   Next.js    │ ◄──────────────► │    FastAPI        │
│   Frontend   │    :3000→:8000   │    (Uvicorn)      │
└──────────────┘                  ├──────────────────┤
                                  │  API Routes       │
                                  │  Middleware        │
                                  ├──────────────────┤
                                  │  Services          │
                                  │  Event Bus         │
                                  ├──────────────────┤
                                  │  LangGraph Engine  │
                                  │  (StateGraph)      │
                                  ├──────────────────┤
                                  │  AI Providers      │
                                  │  (Gemini via       │
                                  │   LangChain)       │
                                  ├──────────────────┤
                                  │  SQLAlchemy ORM    │
                                  │  + Alembic         │
                                  ├──────────┬────────┤
                                  │  SQLite  │Checkpt │
                                  │  (main)  │(LG)    │
                                  └──────────┴────────┘
```

---

## 13. Key Dependencies

```toml
[project]
requires-python = ">=3.12"

[project.dependencies]
fastapi = ">=0.115"
uvicorn = { version = ">=0.34", extras = ["standard"] }
pydantic = ">=2.10"
pydantic-settings = ">=2.7"
sqlalchemy = { version = ">=2.0", extras = ["asyncio"] }
aiosqlite = ">=0.20"
alembic = ">=1.14"
langgraph = ">=1.2"
langgraph-checkpoint-sqlite = ">=3.1"
langchain-google-genai = ">=4.2"
langchain-core = ">=0.3"
google-genai = ">=1.0"
httpx = ">=0.28"
python-dotenv = ">=1.0"
orjson = ">=3.10"
loguru = ">=0.7"
sse-starlette = ">=2.2"
slowapi = ">=0.1"
```

---

## 14. Future Scalability

### 14.1 PostgreSQL Migration
- Change `DATABASE_URL` from `sqlite+aiosqlite:///...` to `postgresql+asyncpg://...`
- Swap `langgraph-checkpoint-sqlite` → `langgraph-checkpoint-postgres`
- Run `alembic upgrade head`
- No code changes required

### 14.2 Additional AI Providers
- Implement `OpenAIProvider(BaseLLMProvider)` and `AnthropicProvider(BaseLLMProvider)`
- Register in `ProviderRegistry`
- Add config: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- No engine or service changes

### 14.3 Workflow Customization
- The graph builder can accept dynamic topologies from the planner's output
- Support for user-defined node configurations via the `AgentConfigPanel`
- Per-node model/temperature overrides stored in `NodeConfig`

### 14.4 Multi-User Support
- Add `users` table and JWT authentication middleware
- Scope all queries by `user_id`
- No architectural changes required

### 14.5 Horizontal Scaling
- Replace in-process `EventBus` with Redis pub/sub
- Replace SQLite with PostgreSQL
- Deploy behind a load balancer with sticky sessions for SSE

---

## 15. Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **LangGraph over raw LangChain chains** | First-class support for stateful graphs, checkpointing, parallel branches, and human-in-the-loop interrupts — exactly what Nexora needs |
| **`langchain-google-genai` (not raw SDK)** | Provides `ChatGoogleGenerativeAI` compatible with LangGraph's `RunnableLambda` / node patterns; structured output via `.with_structured_output()` |
| **Gemini 2.5 Flash as default** | Free tier, fast inference, sufficient quality for all agent tasks, generous rate limits (30 RPM free) |
| **SQLite + async (aiosqlite)** | Zero-config for hackathon; async driver prevents blocking; PostgreSQL migration is a DSN change |
| **Repository pattern** | Decouples ORM from services; makes testing trivial (mock repositories) |
| **In-process EventBus** | SSE needs are single-process for now; Redis upgrade path is clean when scaling horizontally |
| **`sse-starlette`** | Production-grade SSE for FastAPI with proper keepalive and connection management |
| **`interrupt_before` for approval** | LangGraph's native interrupt mechanism — cleaner than polling or manual state hacks |
| **orjson for serialization** | 10x faster than stdlib json; critical for large state snapshots |
| **Separate checkpoint DB** | LangGraph checkpointer manages its own SQLite; keeps it isolated from application data |

---

## 16. Quality Gates Checklist

Before any feature is considered complete:

- [ ] Architecture consistency with this document
- [ ] Error handling for all failure paths
- [ ] Input validation via Pydantic schemas
- [ ] Structured logging with request ID
- [ ] Type hints on all functions and return values
- [ ] API response consistency (always `ApiResponse[T]`)
- [ ] Scalability (async, non-blocking)
- [ ] Security (no hardcoded secrets, input sanitization)
- [ ] Integration tested against frontend expectations
- [ ] OpenAPI docs auto-generated and accurate

---

## Appendix A: Gemini Free Tier Limits (as of Aug 2026)

| Model | Free RPM | Free RPD | Notes |
|-------|----------|----------|-------|
| Gemini 2.5 Flash | ~30 | 1500 | **Recommended default** — best speed/cost ratio |
| Gemini 2.5 Pro | 5 | 50 | Available but severely rate-limited on free tier |
| Gemini 2.0 Flash | ~15 | 1500 | Fallback option |

We default to **Gemini 2.5 Flash** for all agents. The provider abstraction allows per-node model overrides if a user wants to use Pro for the planner and Flash for researchers.
