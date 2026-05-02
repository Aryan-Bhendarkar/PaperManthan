# Milestone 0 — Foundation Day

**Estimated time:** 4–6 hours (single focused session if possible)
**Risk killed:** "Will my entire stack actually run end-to-end?"
**Definition of Done:** A FastAPI backend on Render returns "Hello from mentor" via Gemini, logged to Langfuse, with the Next.js frontend on Vercel calling it. Repo committed, deploys auto-trigger, secrets set.

---

## Why this milestone exists

Most indie projects die in week 2 because the dev env is broken. We kill that risk on day 1. By end of Milestone 0, you have a deployable hello-world. Every subsequent milestone is "add a feature to a thing that already deploys." That's the only sane way to build.

## Learning Objectives

By the end of this, Riku must be able to:
- Explain what FastAPI does and why we picked it over Django/Flask in his own words.
- Explain what `uv` is and why we chose it over pip.
- Explain what an environment variable is, why we use them, and where they're stored locally vs in production.
- Explain what Server-Sent Events (SSE) are and why we'll use them for streaming the mentor.
- Set up secrets in Vercel and Render without leaking them.

---

## Tasks

### Task 0.1 — Account creations (~30 min)

You'll need accounts on these. Free tier, no credit card initially except where noted.

- [ ] GitHub (you have this)
- [ ] Vercel — sign up with GitHub
- [ ] Render — sign up with GitHub
- [ ] Supabase — new project, region: `Mumbai (ap-south-1)` for India latency
- [ ] Google AI Studio — for Gemini API key (free tier)
- [ ] Anthropic Console — for Claude API key (requires payment method, you'll spend ~$5–10 total in v1)
- [ ] Langfuse Cloud — free tier, sign up with GitHub

**Save all keys in a local `.env.local` file. NEVER commit this file. Add it to `.gitignore` first thing.**

#### LEARNING CHECKPOINT 0.1
Before moving on, have the AI agent ask you:
> "Why do we keep API keys in environment variables instead of in code? What happens if you commit a `.env` file to a public repo?"

If you can't answer crisply, the agent must explain — including the practical horror story of bots scraping GitHub for AWS keys within 60 seconds of commit.

---

### Task 0.2 — Repo structure (~20 min)

Create one repo: `paper-socratic` (or whatever you name it). Monorepo style:

```
paper-socratic/
├── README.md
├── BUILD_PLAYBOOK.md          (move from this artifact)
├── v1-product-spec.md          (move from earlier artifact)
├── build-playbook/             (this whole directory)
├── BLOG_NOTES.md
├── IDEAS_PARKING_LOT.md
├── DECISION_LOG.md
├── .gitignore
├── apps/
│   ├── web/                   (Next.js — Milestone 5)
│   └── api/                   (FastAPI — set up here)
└── packages/
    └── eval/                  (eval harness — Milestone 3)
```

For Milestone 0, only `apps/api/` matters. The rest are placeholders.

> **AI agent:** before scaffolding the FastAPI app, ask Riku what *he* thinks should go in `apps/api/`. Have him sketch the structure first. Then refine together.

---

### Task 0.3 — FastAPI backend skeleton (~60 min)

#### MUST_WRITE_HIMSELF
Riku writes:
- The FastAPI `main.py` `app` instance
- The `/health` endpoint
- The `/hello-mentor` endpoint that calls Gemini
- The Pydantic request/response models

AI provides:
- The `pyproject.toml` setup with `uv`
- The Gemini client wrapper (boilerplate only — Riku reviews line by line)
- The CORS configuration
- A clear explanation of project layout decisions

```
apps/api/
├── pyproject.toml             (uv-managed)
├── .python-version            (3.12)
├── src/
│   └── socratic/
│       ├── __init__.py
│       ├── main.py            ← Riku writes
│       ├── config.py          ← env var loading via pydantic-settings
│       ├── llm/
│       │   ├── __init__.py
│       │   ├── gemini.py      ← AI scaffolds, Riku reviews
│       │   └── claude.py      (empty for now)
│       └── models/
│           └── api.py         ← Pydantic request/response — Riku writes
└── tests/
    └── test_health.py         ← Riku writes
```

Run locally:
```bash
cd apps/api
uv sync
uv run fastapi dev src/socratic/main.py
```

Should serve at `http://localhost:8000/health` returning `{"status": "ok"}`.

#### LEARNING CHECKPOINT 0.3
Before moving past this task:
- Riku must run `curl localhost:8000/hello-mentor` and see Gemini's response.
- AI agent asks: *"Walk me through what happened when that request hit your server. From the curl command to the response, every layer."*

If Riku can't trace it, the agent re-explains the request lifecycle.

---

### Task 0.4 — Langfuse from minute one (~45 min)

Wrap the Gemini call in Langfuse tracing **before** anything else gets built. This is non-negotiable per Sacred Rule 7.

```python
# Pseudocode — Riku writes the actual code with AI guidance
from langfuse import observe

@observe(name="hello_mentor")
def call_mentor(prompt: str) -> str:
    # ... gemini call ...
    return response
```

Verify in Langfuse dashboard that traces appear with input, output, latency, and (when available) cost.

#### LEARNING CHECKPOINT 0.4
AI agent asks:
> "What three things will Langfuse let you do in 4 weeks that you couldn't do without it?"

Expected answer hits: debug failed agent runs, track cost per user, A/B test prompts. If Riku misses these, agent fills the gap.

---

### Task 0.5 — Frontend hello (~45 min)

Scaffold Next.js in `apps/web`:

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --src-dir
```

Add a single page that calls the FastAPI `/hello-mentor` endpoint and renders the response.

#### MUST_WRITE_HIMSELF
- The fetch call from Next.js to the API (this is your first React/Next session — type it slowly)
- The basic loading state ("Mentor is thinking...")

#### LEARNING CHECKPOINT 0.5
AI asks:
> "Right now your frontend is at `localhost:3000` and your backend is at `localhost:8000`. Why does this even work? What's CORS and why is it relevant here? What would have happened if we hadn't configured it?"

---

### Task 0.6 — Deploy both (~60 min)

- [ ] Push to GitHub (private repo for now)
- [ ] Connect Vercel to the repo. Configure: root directory `apps/web`. Add `NEXT_PUBLIC_API_URL` env var pointing to (will be set after Render deploys).
- [ ] Connect Render to the repo. New Web Service, root directory `apps/api`. Build: `pip install uv && uv sync`. Start: `uv run fastapi run src/socratic/main.py --port $PORT`. Add env vars for Gemini, Langfuse keys.
- [ ] Update Vercel's `NEXT_PUBLIC_API_URL` to point at the Render URL.
- [ ] Update FastAPI CORS to allow the Vercel URL.
- [ ] Visit your live Vercel URL. See "Hello from mentor" rendered.

#### LEARNING CHECKPOINT 0.6
AI asks:
> "What happens between `git push` and your live site updating? Walk through the deploy chain end-to-end for both Vercel and Render."

---

### Task 0.7 — Set up the meta-files (~20 min)

Create and add a one-line entry to each:

- [ ] `BLOG_NOTES.md` — "Milestone 0 done. The hardest part was [X]. I learned [Y]."
- [ ] `DECISION_LOG.md` — Log: "Chose Render over Fly.io because: …"
- [ ] `IDEAS_PARKING_LOT.md` — Empty. Ready for later.

These files are not optional. They're the spine of your eventual blog post and resume narrative.

---

## Definition of Done

All boxes checked:
- [ ] Live frontend on Vercel renders "Hello from mentor"
- [ ] Backend on Render is up, /health returns OK
- [ ] Langfuse dashboard shows your trace
- [ ] You can explain (out loud, no notes) every layer of the request lifecycle
- [ ] Repo is private, has README, has BUILD_PLAYBOOK.md, has v1-product-spec.md
- [ ] All five LEARNING CHECKPOINTS passed
- [ ] BLOG_NOTES.md has a Milestone 0 entry

## Common pitfalls to flag for Riku

- **Don't optimize prematurely.** Render's cold-start on free tier is ~30s. That's fine for v1. Don't pay $7/mo for always-on yet.
- **Don't use `pip` because tutorials use it.** We chose `uv` deliberately. Stick with it.
- **Don't skip the Langfuse setup.** It is *the* feature that makes this a portfolio project rather than a hobby project. Resist the urge to add it "later."
- **Don't make the API return JSON when it should stream.** We're not streaming yet (Milestone 2), but design endpoints with streaming in mind.

---

**Next:** `milestones/01-hello-mentor.md` — make the mentor actually have a personality, not just echo Gemini.
