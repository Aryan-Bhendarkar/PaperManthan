<div align="center">

# PaperManthan

### *Churn the paper. Extract the wisdom.*

**A Socratic AI mentor that teaches CS students to read foundational AI/ML research papers — through guided two-way dialogue, not chat-bot summaries.**

[![Status](https://img.shields.io/badge/status-in%20development-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Stack](https://img.shields.io/badge/stack-Python%20%7C%20FastAPI%20%7C%20LangGraph%20%7C%20Next.js-informational)]()

[The Problem](#-the-problem) · [The Solution](#-the-solution) · [How It's Different](#-how-its-different) · [Architecture](#-architecture) · [For AI Agents](#-for-ai-coding-agents)

</div>

---

## 📖 The Name

**Manthan** (मंथन) is Sanskrit for *"the churning."* It refers to *Samudra Manthan* — the mythological churning of the cosmic ocean, where gods and demons worked together to extract wisdom and nectar from the depths.

That is exactly what reading a research paper feels like when done right: a slow, effortful churn that transforms surface text into deep understanding. **Manthan the product makes that churn happen — instead of letting users skim, it makes them think.**

Pronounced **MUN-thun**.

---

## 🎯 The Problem

CS students breaking into AI/ML in 2026 are stuck in a paradox:

- They are told to read foundational papers (Attention Is All You Need, ResNet, AlexNet, Sutskever's seq2seq, the Sutskever 30u30 list).
- They open one. The math is dense. The notation is unfamiliar. The prose assumes prior context.
- They give up after 20 minutes and go back to YouTube tutorials.
- They graduate without ever truly reading a paper. They fail technical interviews that ask about transformers, attention, scaling laws.

**Existing tools make this worse, not better.**

| Tool | What it does | Why it fails learners |
|---|---|---|
| ChatGPT / Claude | Paste paper, ask questions | Gives answers without making the user think — *"comprehension theater"* |
| Explainpaper / SciSpace | AI summarizes / explains highlights | Reactive, not pedagogical — no curriculum, no progression |
| YouTube (Karpathy, 3B1B) | Brilliant lectures | Passive consumption — students watch, don't engage |
| Coursera / fast.ai | Structured courses | Don't teach the skill of *reading the original literature* |

**The gap:** there is no tool that teaches a student to read research papers the way a great professor would — by asking questions, withholding answers, calibrating to the student's level, and verifying real understanding.

> *"I bookmarked Sutskever's 30 papers list a year ago. I've finished none of them."* — every CS student, ever.

---

## 💡 The Solution

Manthan is a **Socratic AI mentor** built around three commitments that no other tool combines:

### 1. The mentor asks before it answers.

Inspired by ChatGPT's Study Mode and the Khan Academy Khanmigo philosophy, the mentor never dumps an answer. When you submit a thought, it probes: *"What makes you think that?"* *"What would happen if X were different?"* The "Reveal Hint" button is gated by a 30-second timer — the friction is the pedagogy.

### 2. The mentor calibrates to the user.

A learner-state model tracks what each user has understood, where they stumbled, and what vocabulary level they operate at. Every session opens with that context injected into the mentor's reasoning. **Two users reading the same paper get fundamentally different conversations.**

### 3. Comprehension is *verified*, not assumed.

Each level ends with a two-phase **boss fight**:
- **Phase 1 — Free response:** Explain the paper's core idea in your own words. Graded by an LLM-as-judge against a multi-axis rubric (accuracy, depth, own-words, key-insight) calibrated against 50+ hand-graded human examples.
- **Phase 2 — Teach-back:** Explain the concept to *The Examiner* — a neutral AI playing a curious learner with high-school math. Field 3–4 progressively harder follow-ups. Pass = level unlocks.

**The curriculum** is a leveled adaptation of [Ilya Sutskever's "30u30" canonical reading list](https://github.com/dzyim/ilya-sutskever-recommended-reading) — the papers Sutskever told John Carmack would teach you "90% of what matters" in deep learning.

```
Level 1 — Foundations         Backprop intuition, RNNs (Karpathy)
Level 2 — Vision              AlexNet, ResNet
Level 3 — Sequence            Olah's LSTM, Seq2Seq (Sutskever)
Level 4 — Attention           Bahdanau, Attention Is All You Need 🏁
Level 5 — Scale               Scaling Laws (Kaplan), GPT-2
```

---

## 🚀 How It's Different

The honest comparison every potential user thinks to themselves:

| Question a user might ask | Manthan's answer |
|---|---|
| *"Can't I just paste the paper into ChatGPT?"* | ChatGPT gives answers; Manthan makes you find them. ChatGPT doesn't know what you've already learned; Manthan does. ChatGPT doesn't tell you which paper to read next or whether you actually got the last one; Manthan does. |
| *"Why not just watch Karpathy?"* | You should — and we recommend you do, alongside Manthan. Watching is passive; Manthan is the active practice that turns watching into knowing. |
| *"Why not Coursera or fast.ai?"* | Those teach you to *use* ML. Manthan teaches you to *read its primary literature* — a different and rarer skill, and the one that signals real depth in interviews. |

---

## 🏗️ Architecture

Manthan is a production-grade agentic AI system, not a prompt-wrapper. Every piece is intentional and designed to teach the builder modern AI engineering.

```
┌─────────────────────────────────────────────────────────────┐
│   FRONTEND — Next.js 15 / React 19 / TS / Tailwind          │
│   ┌──────────┐ ┌──────────────┐ ┌─────────────┐             │
│   │ Level Map│ │Socratic Sess.│ │ Boss Fight  │             │
│   └──────────┘ └──────┬───────┘ └──────┬──────┘             │
└────────────────────────┼────────────────┼───────────────────┘
                         │ SSE streaming  │ REST
                         ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│   BACKEND — FastAPI / Python 3.12 / LangGraph               │
│                                                             │
│   ┌────────────────────────────────────────────────────┐    │
│   │ MENTOR AGENT (LangGraph state machine)             │    │
│   │ States: probe → await → evaluate → hint/reveal     │    │
│   │ Tools:  record_understanding, flag_stumble,        │    │
│   │         advance_section, retrieve_excerpt          │    │
│   └────────────────────────────────────────────────────┘    │
│                                                             │
│   ┌────────────────────┐ ┌─────────────────────────────┐    │
│   │ GRADER (boss fight)│ │ LEARNER STATE SERVICE       │    │
│   │ - Free-resp rubric │ │ - vocabulary level          │    │
│   │ - Teach-back judge │ │ - understood concepts JSONB │    │
│   │ - Calibrated       │ │ - stumbled concepts JSONB   │    │
│   └────────────────────┘ └─────────────────────────────┘    │
│                                                             │
│   ┌────────────────────┐ ┌─────────────────────────────┐    │
│   │ RAG (hybrid)       │ │ LLM ROUTER                  │    │
│   │ - bge-small embed  │ │ - Gemini 2.5 Flash (mentor) │    │
│   │ - pgvector         │ │ - Claude Haiku (grader)     │    │
│   │ - narrative md     │ │ - cost-aware fallback       │    │
│   └────────────────────┘ └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │                  │
                         ▼                  ▼
              ┌───────────────────┐ ┌──────────────────┐
              │ Supabase Postgres │ │ Langfuse         │
              │ + pgvector + Auth │ │ traces · evals   │
              └───────────────────┘ └──────────────────┘
```

### What's actually interesting under the hood

- **Multi-provider LLM routing** — Gemini for mentor (free tier, 1M context), Claude for grading (rubric reliability matters most). Not everything-on-one-vendor.
- **Structured outputs everywhere** — Pydantic schemas + JSON mode, so the agent's decisions are typed and debuggable, not parsed-from-prose.
- **LLM-as-judge with hand-calibrated rubrics** — 50+ comprehension answers hand-graded, agreement statistics computed, prompts iterated until human/LLM Pearson correlation ≥ 0.75.
- **Continuous learner-state model** — every mentor turn updates a per-user understanding map. The "Skill Map" page visualizes this for the user; the mentor reads from it to personalize.
- **Hybrid retrieval** — BM25 + dense embeddings + reranker over hand-edited paper narratives, so the mentor never hallucinates technical specifics.
- **Production observability from day one** — Langfuse traces every node, every tool call, every cost. Not bolted on later.

---

## 📚 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript | Modern full-stack, server components, Vercel deploy |
| UI | Tailwind + shadcn/ui | Production-grade design system out of the box |
| Backend | Python 3.12 + FastAPI | AI/ML industry standard, async, fast |
| Agent | LangGraph | Explicit state graphs, debuggable, the modern choice |
| Validation | Pydantic v2 | Typed structured outputs |
| Database | Supabase Postgres + pgvector | DB + auth + vectors in one |
| Embeddings | bge-small (sentence-transformers) | Local, free, strong |
| LLM (mentor) | Gemini 2.5 Flash | Free tier, 1M context |
| LLM (grader) | Claude Haiku 4.5 | Reliable rubric grading |
| Observability | Langfuse | Production AI requires production observability |
| Eval | DeepEval + custom rubrics | [Open-sourced separately](#-open-source) |
| Hosting | Vercel + Render | Free tiers, ~$0/mo |

**Total monthly infra cost:** ~$0–10. This is intentional — the project demonstrates *cost-aware* AI engineering, a 2026-relevant skill.

---

## 🎯 Project Status

**Currently:** Pre-build. Phase 1–3 complete (validation, market research, architecture). Phase 4 (build) starting now.

**Timeline:** ~12–16 weeks of solo development alongside university coursework.

**Soft launch target:** Indian CS student communities (PES, RVCE, IIIT-B, BMSCE, NMIT in Bangalore + extended college network).

**Success metrics for v1 (90 days post-launch):**
- 300–800 signups
- 100+ users complete Level 1
- 30+ users complete Level 3
- 5–15 users complete the full curriculum
- 1 widely-shared technical blog post on the LLM-as-judge eval methodology

See [`v1-product-spec.md`](./v1-product-spec.md) for the full locked spec.

---

## 🤖 For AI Coding Agents

If you are an AI agent (Cursor, Claude Code, etc.) reading this codebase to help build it: **read in this order before suggesting any code.**

1. **`BUILD_PLAYBOOK.md`** — the operating rules for this build (the "Sacred Rules" you must follow).
2. **`v1-product-spec.md`** — the locked product specification. Do not propose features outside this.
3. **`build-playbook/milestones/<current>.md`** — the current milestone being worked on.
4. **`DECISION_LOG.md`** — every prior architectural decision and its reasoning.
5. **`build-playbook/reference/ai-agent-prompt.md`** — your behavioral contract.

Your role is **Socratic teacher**, not code-vending machine. The human builder must understand what gets built, not just receive it.

Key rules:
- Ask before you tell. Have the human walk through the task before suggesting code.
- For `MUST_WRITE_HIMSELF` blocks (system prompts, agent loops, eval rubrics), provide scaffolding only.
- Never bypass observability or eval setup to "ship faster."
- Surface trade-offs explicitly. Let the human pick.
- Reference Langfuse traces during debugging.

Full behavioral contract in [`build-playbook/reference/ai-agent-prompt.md`](./build-playbook/reference/ai-agent-prompt.md).

---

## 🗂️ Repository Structure

```
manthan/
├── README.md                       ← you are here
├── BUILD_PLAYBOOK.md               ← the build operating manual
├── v1-product-spec.md              ← the locked product spec
├── DECISION_LOG.md                 ← every architectural decision
├── BLOG_NOTES.md                   ← running notes for the case study
├── IDEAS_PARKING_LOT.md            ← v2 ideas (NOT to be built in v1)
│
├── build-playbook/
│   ├── milestones/                 ← 9 milestone files (00–08)
│   └── reference/                  ← AI agent prompts, templates
│
├── apps/
│   ├── web/                        ← Next.js frontend
│   └── api/                        ← FastAPI backend
│
├── packages/
│   └── eval/                       ← LLM-as-judge eval harness (open-source)
│
└── content/
    └── papers/                     ← hand-edited paper narratives
        ├── alexnet-2012/
        ├── resnet-2015/
        └── ...
```

---

## 🧪 Open Source

The **LLM-as-judge eval harness** is being developed in `packages/eval/` and will be released as a standalone open-source package: `manthan-eval` — a generic framework for evaluating LLM comprehension grading against human-calibrated rubrics, applicable beyond ML papers (medical training, legal review, technical interviews, etc.).

The eval harness is the most reusable artifact of this project and is being designed accordingly.

---

## 📝 Building This in Public

Each milestone is being documented in `BLOG_NOTES.md` as it happens. The final case study — *"Building a Socratic AI mentor that actually verifies comprehension"* — will cover:

- The pedagogical theory behind Socratic AI tutoring
- The LangGraph state machine design and why it matters
- How the LLM-as-judge rubric was calibrated (with real disagreement examples)
- Cost-aware multi-provider LLM routing in production
- What worked, what didn't, and what I'd build differently

Target publication: post-soft-launch, ~week 14–16 of the build.

---

## 👤 About the Builder

Built by **Riku** — 2nd year CS student, Bangalore. Strong DSA + AI/ML background. Previous projects: image classifier, recommendation system, chatbot, data analysis.

This project is being built as both a genuine product *and* a deep learning vehicle: by the end of v1, the goal is fluency in production-grade Python, FastAPI, LangGraph, RAG, LLM evaluation, and modern frontend — the exact skill set 2026 AI engineering hiring is screening for.

If you're a recruiter, hiring manager, or fellow learner — reach out. The technical case study post-launch will go deeper than this README does.

---

## 🤝 Contributing

Manthan is currently a solo build during its v1 phase to preserve focus and design integrity. Once v1 ships, contribution guidelines will be added — particularly for:
- Additional paper narratives (the curriculum should grow community-curated)
- Translations of the mentor prompts to other languages
- New rubric axes for the eval harness

⭐ **Star the repo if you want to follow along** — substantial updates and the launch announcement will go to watchers first.

---

## 📜 License

MIT for the codebase. Paper content (narratives, rubrics) under CC BY-SA 4.0. Original research papers retain their respective licenses (most arXiv papers are openly accessible).

---

<div align="center">

**Manthan** — *Churn the paper. Extract the wisdom.*

मंथन

</div>