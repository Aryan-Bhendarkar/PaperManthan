# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Before Any Code Session

Read these files in order before writing or suggesting code:
1. [build-playbook/BUILD_PLAYBOOK.md](build-playbook/BUILD_PLAYBOOK.md) — the operating manual and Sacred Rules
2. [v1-product-spec.md](v1-product-spec.md) — the locked product spec (no scope creep)
3. The current milestone file in [build-playbook/milestones/](build-playbook/milestones/)
4. [DECISION_LOG.md](DECISION_LOG.md) — prior architectural decisions

Your first message in any session must summarize the current task and ask Aryan what he thinks should happen — do not write code first.

## Sacred Rules for AI Agents (non-negotiable)

1. **Ask before you tell** — Before any non-trivial code, ask Aryan what he thinks should happen. Wait.
2. **Explain why, not just what** — Every architectural decision includes reasoning.
3. **Pause at LEARNING CHECKPOINTs** — Verify Aryan can explain the concept before advancing.
4. **MUST_WRITE_HIMSELF blocks** — Provide a scaffold only; Aryan writes the body.
5. **Smallest working thing first** — End-to-end working, then extend.
6. **Surface trade-offs** — Present options with pros/cons; let Aryan pick.
7. **Never bypass observability or eval** — Langfuse tracing and eval harness are mandatory from Milestone 1.
8. **Commit messages teach** — Aryan writes them (what + why); you review.

## Development Commands

### Backend (`apps/api/`)
```bash
uv sync                                          # install dependencies
uv run fastapi dev src/socratic/main.py          # dev server at localhost:8000
uv run pytest tests/                             # run tests
uv run ruff format src/ tests/                   # format
uv run ruff check src/ tests/                    # lint
```

### Frontend (`apps/web/`)
```bash
npm install
npm run dev                                      # dev server at localhost:3000
```

### Eval Harness (`packages/eval/`)
```bash
uv run python -m eval.runners calibrate --samples calibration_set.jsonl
```

## Architecture

This is a monorepo with three packages:
- **`apps/api/`** — FastAPI backend (Python 3.12, `uv`)
- **`apps/web/`** — Next.js 15 frontend (React 19, TypeScript, Tailwind, shadcn/ui)
- **`packages/eval/`** — standalone eval harness for rubric calibration

### Backend Module Hierarchy

```
src/socratic/
├── main.py          # FastAPI app + route handlers
├── config.py        # Pydantic Settings (env vars)
├── models/api.py    # Pydantic request/response schemas
├── llm/
│   ├── gemini.py    # Gemini 2.5 Flash client (mentor streaming)
│   └── claude.py    # Claude Haiku 4.5 client (grader/evaluator)
├── agent/
│   └── mentor.py    # LangGraph state machine (Milestone 2)
├── prompts/
│   └── mentor_v0.md # Versioned Socratic system prompt
├── db/
│   └── repository.py # Supabase Postgres access layer (Milestone 2)
└── tools/
    └── retrieval.py  # pgvector RAG tool (Milestone 4)
```

### Mentor Agent State Flow (LangGraph)

```
LOAD_LEARNER_STATE → PROBE → AWAIT_USER → EVALUATE_RESPONSE
    → [HINT | REVEAL] → ADVANCE_OR_REPEAT → PERSIST_STATE
```

Each node is explicit, testable, and traced in Langfuse. The LLM is one component (evaluation + response generation), not the entire flow.

### Two-Model Strategy

- **Gemini 2.5 Flash** — mentor dialogue (streaming, high-volume, cost-effective)
- **Claude Haiku 4.5** — grader and evaluator (instruction-following, structured output)

### Two-Phase Grading (Milestone 3)

1. **Free-response** — rubric with 4 axes: accuracy, depth, own_words, key_insight (0–10 each)
2. **Teach-back** — student explains to an AI Examiner persona; graded on clarity and handling of follow-ups

Calibration: hand-grade 50 samples, measure human-vs-LLM agreement (target Pearson ≥ 0.75, pass/fail ≥ 80%).

### RAG Layer (Milestone 4)

- Embeddings: `bge-small` (384-dim) via `sentence-transformers`
- Storage: pgvector extension in Supabase Postgres (`paper_chunks` table)
- Retrieval: BM25 + dense similarity; mentor agent calls `retrieve` tool for top-3 chunks

### Frontend Routes (Milestone 5+)

```
/              # Curriculum / Level Map
/login         # Supabase Auth (Google + email magic link)
/session/[id]  # 3-pane session UI (paper | chat | thinking input)
/boss/[id]     # Boss Fight / teach-back exam
/u/[username]  # Public profile with radar chart
```

### Database Schema (Supabase Postgres)

Key custom tables: `learner_state` (per-user concept mastery as JSONB), `sessions`, `turns`, `paper_chunks` (with pgvector embeddings). Auth tables are managed by Supabase Auth.

## Key Documentation Files

| File | Purpose |
|------|---------|
| `build-playbook/BUILD_PLAYBOOK.md` | Master operating manual |
| `v1-product-spec.md` | Frozen product spec — no scope changes without approval |
| `build-playbook/milestones/` | 9 milestone guides (read the active one each session) |
| `DECISION_LOG.md` | Architectural decisions + rationale (update when choices are made) |
| `BLOG_NOTES.md` | 2–3 paragraphs per milestone (becomes the launch blog post) |
| `IDEAS_PARKING_LOT.md` | Out-of-scope ideas — write here, not in code |

## Deployment

- **Frontend:** Vercel — auto-deploys from GitHub; env var: `NEXT_PUBLIC_API_URL`
- **Backend:** Render — build: `pip install uv && uv sync`; start: `uv run fastapi run src/socratic/main.py --port $PORT`; env vars: `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `LANGFUSE_*`, Supabase URLs
- **Database:** Supabase (Postgres + Auth + pgvector) in Mumbai region (ap-south-1)
- **Observability:** Langfuse Cloud — every LLM call must be traced; never remove tracing to ship faster
