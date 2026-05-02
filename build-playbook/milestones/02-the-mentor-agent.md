# Milestone 2 — The Mentor Agent (LangGraph)

**Estimated time:** 12–18 hours (split across 3–4 sessions)
**Risk killed:** "Can I build a real agent with state, tools, and persistence?"
**Definition of Done:** A LangGraph-powered Mentor Agent with explicit states, tool calls, persistent learner-state in Postgres, and a measurable improvement in pedagogy quality vs Milestone 1's pure-prompt baseline.

---

## Why this milestone exists

Milestone 1 proved prompts can do *some* Socratic work. But pure prompts can't:
- Remember what the user understood across sessions
- Decide when to advance vs when to hint vs when to retreat
- Update a learner-state model
- Handle long conversations without drift

For that, we need an **agent**: a state machine where the LLM is one component, but explicit code controls the flow.

This is the largest single milestone. It's also the technical centerpiece of your portfolio.

## Learning Objectives

By the end of this, Riku must be able to:
- Draw the Mentor Agent state graph from memory.
- Explain what LangGraph adds vs writing the same logic in plain Python.
- Define structured outputs with Pydantic and use them with Gemini.
- Design tool calls that update DB state cleanly.
- Migrate from in-memory session store to Supabase Postgres.

---

## Pre-work — Conceptual setup before any code (~60 min)

### MUST_WRITE_HIMSELF — Draw the state graph on paper

Riku grabs paper and draws the Mentor's state machine. Iterate with AI agent until clean. Suggested states:

```
                 ┌────────────────────┐
                 │ LOAD_LEARNER_STATE │
                 └────────┬───────────┘
                          ▼
                 ┌────────────────────┐
              ┌──┤  PROBE             │ ← starts here for new section
              │  │  (mentor asks)     │
              │  └────────┬───────────┘
              │           ▼
              │  ┌────────────────────┐
              │  │  AWAIT_USER        │
              │  └────────┬───────────┘
              │           ▼
              │  ┌────────────────────┐
              │  │  EVALUATE_RESPONSE │ ← LLM judges quality
              │  └────────┬───────────┘
              │           ▼
              │     ╱─────────╲
              │    ▼           ▼
              │  WRONG       RIGHT
              │    │           │
              │    ▼           ▼
              │  ┌──────┐   ┌──────────────┐
              └──┤ HINT │   │ REVEAL_INSIGHT│
                 └──────┘   └──────┬───────┘
                                   ▼
                          ┌────────────────────┐
                          │  ADVANCE_OR_REPEAT │
                          └────────┬───────────┘
                                   ▼
                          ┌────────────────────┐
                          │  PERSIST_STATE     │ → DB write
                          └────────────────────┘
```

#### LEARNING CHECKPOINT (pre-work)
AI asks:
> "Why is EVALUATE_RESPONSE its own node and not just part of the prompt? What does separating it buy us?"

Expected: testability, separate model choice (cheaper for evaluation), explicit logging, easier to swap rubrics.

---

## Tasks

### Task 2.1 — Postgres schema for learner state (~90 min)

In Supabase, create tables:

```sql
-- users table is auto-created by Supabase Auth
-- We add:

create table learner_state (
  user_id uuid primary key references auth.users(id),
  current_level int default 0,
  current_paper_id text,
  current_section int default 0,
  vocabulary_level int default 1,         -- 1-5 scale
  understood_concepts jsonb default '{}', -- {"backprop": 0.8, "softmax": 0.6}
  stumbled_concepts jsonb default '{}',
  last_session_at timestamptz,
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  paper_id text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  agent_state jsonb,         -- the LangGraph state at end of session
  turn_count int default 0
);

create table turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  turn_number int,
  role text check (role in ('user', 'mentor', 'tool')),
  content text,
  tool_name text,
  tool_args jsonb,
  state_node text,           -- which LangGraph node produced this
  created_at timestamptz default now()
);
```

#### MUST_WRITE_HIMSELF
- The schema (Riku writes the SQL by hand, doesn't copy-paste)
- The Pydantic models that mirror the schema
- A repository class with `get_learner_state(user_id)`, `update_learner_state(user_id, patch)`, `record_turn(session_id, ...)`

#### LEARNING CHECKPOINT 2.1
AI asks:
> "Why is `understood_concepts` a JSONB column instead of a separate `user_concepts` table with rows? What's the trade-off?"

Expected: faster reads, simpler queries for v1, harder to query individual concepts at scale. JSONB is right for our scale.

---

### Task 2.2 — LangGraph state graph implementation (~5–7 hours)

Install LangGraph: `uv add langgraph`

#### MUST_WRITE_HIMSELF
The entire `MentorState` TypedDict, every node function, the graph wiring. AI agent provides the *patterns* but Riku types the code.

```python
# Pseudocode skeleton

from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END

class MentorState(TypedDict):
    user_id: str
    session_id: str
    paper_id: str
    section: int
    history: list[dict]
    learner_state: dict          # loaded from DB at start
    last_user_message: str
    last_mentor_message: str
    pending_tool_calls: list
    next_action: Literal["probe", "hint", "reveal", "advance", "end"]

def load_state_node(state: MentorState) -> MentorState: ...
def probe_node(state: MentorState) -> MentorState: ...
def await_user_node(state: MentorState) -> MentorState: ...
def evaluate_node(state: MentorState) -> MentorState: ...
def hint_node(state: MentorState) -> MentorState: ...
def reveal_node(state: MentorState) -> MentorState: ...
def advance_node(state: MentorState) -> MentorState: ...
def persist_node(state: MentorState) -> MentorState: ...

def route_after_evaluate(state: MentorState) -> str:
    if state["next_action"] == "hint":
        return "hint"
    elif state["next_action"] == "reveal":
        return "reveal"
    # ...

graph = StateGraph(MentorState)
graph.add_node("load_state", load_state_node)
graph.add_node("probe", probe_node)
# ... etc
graph.add_conditional_edges("evaluate", route_after_evaluate, {...})
graph.set_entry_point("load_state")
mentor_agent = graph.compile()
```

The hard parts:
1. **`evaluate_node`** uses Gemini with structured output (Pydantic schema for `{understanding_level: float, gaps: list[str], next_action: str}`).
2. **`probe_node`** assembles a system prompt that includes the learner_state context — *this is where continuous calibration becomes visible*.
3. **`persist_node`** writes back the updated learner_state to Postgres.

#### LEARNING CHECKPOINT 2.2 — Major
After implementation, AI agent runs Riku through:
> "Walk me through what happens between a user typing 'I think backprop is just gradient descent' and the next mentor message appearing on screen. Every node, every DB call, every LLM call. Draw it on paper."

If Riku can't trace it cleanly, do not advance. Re-explain.

---

### Task 2.3 — Structured outputs for evaluation (~90 min)

The `evaluate_node` is the riskiest single piece. Get it right.

```python
from pydantic import BaseModel, Field
from typing import Literal

class EvaluationResult(BaseModel):
    understanding_level: float = Field(ge=0, le=1)
    detected_concepts: list[str]
    gaps: list[str]
    misconception: str | None = Field(default=None)
    next_action: Literal["probe_deeper", "hint", "reveal", "advance"]
    reasoning: str  # for logging only, not user-facing

# In the node:
response = gemini_structured(
    prompt=EVALUATE_PROMPT,
    response_schema=EvaluationResult,
    messages=[...]
)
```

#### LEARNING CHECKPOINT 2.3
AI asks:
> "Why ask the LLM for `reasoning` even though we don't show it to the user? What does this buy us?"

Expected: chain-of-thought improves output quality, gives us debugging signal in Langfuse, lets us catch bad routing decisions in eval.

---

### Task 2.4 — Migrate `/chat/turn` to use the agent (~90 min)

Refactor the Milestone-1 endpoint:

```python
@app.post("/chat/turn")
async def chat_turn(req: TurnRequest, user: User = Depends(get_current_user)):
    initial_state = build_initial_state(user.id, req.session_id, req.message)
    async for event in mentor_agent.astream(initial_state):
        # stream the user-visible mentor message
        yield ...
```

**Key:** the agent's full execution (multiple nodes) happens server-side; only the final `mentor_message` gets streamed to the client. The user shouldn't see internal evaluation reasoning.

#### LEARNING CHECKPOINT 2.4
AI asks:
> "What's the latency cost of running 5 nodes per user message vs the 1 LLM call we had in Milestone 1? Is it worth it? How would you measure?"

This is a real engineering trade-off discussion. Riku should propose: track p50/p95 latency in Langfuse, set a budget (e.g., <8s per turn), accept the cost in exchange for pedagogical quality.

---

### Task 2.5 — A/B comparison: agent vs pure prompt (~120 min) ⚠️ Critical

Replicate the 3-conversations-per-concept test from Milestone 1.5, but with the new agent. Hand-grade with the same rubric.

| Test | Milestone 1 Avg | Milestone 2 Avg | Delta |
|---|---|---|---|
| Asked-before-told | _ | _ | _ |
| One-question-per-turn | _ | _ | _ |
| Withholding | _ | _ | _ |
| Grade-appropriate language | _ | _ | _ |
| **Calibration** (NEW) | N/A | _ | — |

The new dimension — **Calibration** — measures whether the mentor visibly references what the user has shown they understand. Score 0–2 based on whether the mentor's responses reflect prior turns/sessions.

**Decision gate:** If Milestone 2 doesn't beat Milestone 1 on at least 3/4 original dimensions AND show non-zero Calibration, **STOP and debug**. The agent is supposed to be better. If it isn't, we have a bug or a wrong design.

#### LEARNING CHECKPOINT 2.5
At end:
> "What did the agent let you achieve that pure prompting couldn't? What's still imperfect that would benefit from RAG (Milestone 4)?"

---

## Definition of Done

- [ ] Postgres schema deployed in Supabase
- [ ] LangGraph mentor agent implemented end-to-end
- [ ] All node functions have unit tests
- [ ] Structured outputs working reliably (no JSON parse failures in 100 test runs)
- [ ] `/chat/turn` uses the agent and streams only user-facing messages
- [ ] Langfuse traces show every node, every tool call, every state mutation
- [ ] A/B comparison done; agent beats baseline on rubric
- [ ] Learner state visible: query Postgres, see `understood_concepts` updating across turns
- [ ] BLOG_NOTES.md entry — this is one of your most quotable milestones
- [ ] DECISION_LOG.md entry: "LangGraph chosen over plain Python because…"

## ⚠️ This is the first kill-switch checkpoint

If by end of Milestone 2:
- The agent doesn't beat the baseline, OR
- The Socratic feel still feels gimmicky to you when you use it for 30 minutes, OR
- You can't articulate clearly why this is better than ChatGPT for the same use case,

**STOP. Take a week. Reassess.** Pivot options listed in `v1-product-spec.md` Section 10. Sunk cost is a fallacy — six weeks in is the *cheapest* time to pivot.

If it works (and most likely it will, this is a sound design), Milestone 2 alone is already 60% of your portfolio narrative. Document it well.

## Common pitfalls

- **Over-engineering the state.** Don't add a node for every conceivable edge case. Start with 6–7 nodes; add more only when you hit specific bugs.
- **LLM-call cascade explosion.** Check that one user turn = at most 2 LLM calls (one for evaluate, one for response generation). If you're calling the LLM 5x per turn, latency and cost will sink you.
- **Persistence race conditions.** Use Postgres transactions for multi-row updates. Supabase makes this easy.
- **Forgetting to version your prompts.** Every prompt revision goes in `prompts/<name>_changelog.md` with date and reason. This becomes an artifact recruiters will love.

---

**Next:** `milestones/03-grader-and-eval.md` — the boss-fight grader and the eval harness that proves it works.
