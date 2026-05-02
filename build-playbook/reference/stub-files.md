# Stub Files for Project Setup

> When you start the project, create these empty files at the repo root. Each has a one-line purpose.

## BLOG_NOTES.md (start empty)

```markdown
# Blog Notes — Running notes for the final blog post

> Write 2–3 paragraphs after each milestone. Don't polish. Just capture what you learned, what surprised you, what you got wrong, what you'd do differently.

## Milestone 0: Foundation Day

(your notes here as you go)

## Milestone 1: Hello Mentor

(your notes here as you go)

...
```

## IDEAS_PARKING_LOT.md (start empty)

```markdown
# Ideas Parking Lot

> When a "wouldn't it be cool if…" thought hits during the build, write it here. DO NOT BUILD IT in v1.
> Re-read this list at the post-launch retrospective. Some ideas will become v2 features.

| Date | Idea | Triggered by |
|------|------|--------------|
| | | |
```

## DECISION_LOG.md (start with template)

```markdown
# Decision Log

> Each non-trivial architectural decision: what, why, alternatives considered, date.
> This document is interview gold. When recruiters ask "tell me about a hard technical decision you made," this is your source.

## Template for entries

### YYYY-MM-DD — <decision title>

**Choice:** <what we picked>

**Alternatives considered:**
- Option A — pros / cons
- Option B — pros / cons

**Reasoning:** <why we picked it>

**Reversibility:** <how hard would it be to change later? low / medium / high>

---

### 2026-XX-XX — Backend language: Python over Java/Spring

**Choice:** Python 3.12 + FastAPI

**Alternatives considered:**
- Java + Spring Boot — pros: I'm fluent. cons: poor AI/ML library support, weak signal for AI engineering roles.
- Python + FastAPI — pros: industry standard for AI, all libraries first-class. cons: I'm new to Python.
- Python + Django — pros: batteries included. cons: too heavy for our use case, less async-friendly.

**Reasoning:** Career signal + ecosystem fit dominate fluency. Python ramp absorbed by 16-week timeline; AI tooling around me (Claude Code) accelerates the ramp.

**Reversibility:** Low — switching languages mid-project would burn 3+ weeks.
```

## .gitignore (start with this)

```gitignore
# Env
.env
.env.local
.env.*.local

# Node
node_modules/
.next/
dist/
.vercel/

# Python
__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/
.ruff_cache/
.mypy_cache/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
*.log

# Local DB
*.db
*.sqlite

# Eval data with potentially sensitive samples — review before committing
packages/eval/calibration_set.local.jsonl
```

## README.md (start with this — update through the build)

```markdown
# <Project Name>

A Socratic AI mentor that teaches CS students to read foundational AI/ML research papers — through guided two-way dialogue and Feynman-style teach-back gates.

## Status: In Development

Currently on Milestone <N> of 8. Soft-launch target: <date>.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui
- **Backend:** Python 3.12, FastAPI, LangGraph, Pydantic v2
- **DB:** Supabase Postgres + pgvector
- **LLMs:** Gemini 2.5 Flash (mentor), Claude Haiku 4.5 (grader)
- **Observability:** Langfuse
- **Eval:** DeepEval + custom rubrics (open-sourced separately)

## What Makes This Different

Most "AI explains research papers" tools are reactive chatbots. This is a **Socratic curriculum** with three differentiators:

1. **Withholding** — the mentor asks before it tells
2. **Calibration** — the mentor adapts to what each user understands
3. **Verified comprehension** — every level requires explaining the paper back, graded against a calibrated rubric

## Live Demo

<link>

## Open-Source

The eval harness for LLM-as-judge comprehension grading is available separately at <link>.

## Blog Post

Read the full technical writeup: <link>
```

---

## Pre-flight checklist before Day 1

- [ ] Created GitHub repo (private for now)
- [ ] Created Vercel, Render, Supabase, Google AI, Anthropic, Langfuse accounts
- [ ] Cloned `build-playbook/` directory into repo root
- [ ] Created `BLOG_NOTES.md`, `IDEAS_PARKING_LOT.md`, `DECISION_LOG.md`, `.gitignore`, `README.md`
- [ ] First commit: "chore: initial scaffolding and build playbook"
- [ ] Read `BUILD_PLAYBOOK.md` once more
- [ ] Open `milestones/00-foundation-day.md`
- [ ] Open Cursor/Claude Code, paste the AI agent operating prompt
- [ ] Begin.
