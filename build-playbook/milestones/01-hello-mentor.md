# Milestone 1 — Hello Mentor

**Estimated time:** 6–8 hours
**Risk killed:** "Can I make an LLM behave Socratically with prompts alone?"
**Definition of Done:** A FastAPI endpoint that accepts a "user thinking" message and streams back a Socratic mentor response. The mentor follows your pedagogy rules. Every interaction traced in Langfuse.

---

## Why this milestone exists

Before we build agents, state machines, RAG, or grading, we need to answer one question: **can prompt engineering alone make a model feel Socratic?** If the answer is no, we're cooked. If yes, we have a baseline to build on.

This milestone is a single FastAPI endpoint, no DB, no agent loop, no RAG. Just: input message → mentor reply (streamed). But the prompt and the testing rigor are everything.

## Learning Objectives

By the end of this, Riku must be able to:
- Write a system prompt that produces consistent Socratic behavior.
- Explain the difference between system, user, and assistant messages.
- Set up Server-Sent Events (SSE) streaming in FastAPI.
- Read Langfuse traces and identify a "bad" mentor response.
- Hand-evaluate ~10 mentor responses against a rubric.

---

## Tasks

### Task 1.1 — Write the Mentor System Prompt v0 (~90 min)

#### MUST_WRITE_HIMSELF
This is the most important text in the project. Riku writes every word. AI agent gives feedback only.

The prompt has four sections. Riku drafts each, AI critiques, Riku revises:

**Section A — Identity & Role**
> "You are a Socratic mentor for a CS student learning AI/ML by reading foundational research papers. Your goal is not to inform — it is to make them think."

**Section B — Pedagogical Rules**
- Ask before you tell. Always.
- When the user submits a thought, do not immediately confirm or deny. Probe first: "What makes you think that?" or "What would happen if X were different?"
- Never give the full answer in one turn. Reveal in pieces, gated by user engagement.
- If the user is wrong, do not say so directly. Lead them through a thought experiment that exposes the contradiction.
- Praise *thinking*, not *correctness*. "I like that you're pulling on the thread of X" beats "Correct."
- One question per turn. Never stack questions.

**Section C — Format Rules**
- Markdown allowed. Math via `$...$` delimiters.
- Keep turns short — 2–4 sentences typical, longer only when revealing a key insight.
- End every turn with either a question OR an explicit "your turn" prompt.

**Section D — Anti-Patterns to Avoid**
- Don't be sycophantic. "Great question!" is banned.
- Don't lecture. If you find yourself writing more than 5 sentences without a question mark, stop and rewrite.
- Don't pretend to be human. If asked, you are an AI mentor.

#### LEARNING CHECKPOINT 1.1
AI agent asks:
> "Why is 'one question per turn' a rule? What goes wrong with stacked questions in a Socratic dialogue?"

Riku must articulate: stacked questions overwhelm working memory, signal the mentor is uncertain, and let the user cherry-pick the easy one.

Save the prompt as `apps/api/src/socratic/prompts/mentor_v0.md`.

---

### Task 1.2 — Build the streaming endpoint (~90 min)

`POST /chat/turn` — accepts a user message + a `session_id`, streams the mentor reply via SSE.

For now, **no DB**. Conversation history is held in-memory keyed by `session_id` (a Python dict — fine for v1 prototype).

#### MUST_WRITE_HIMSELF
- The endpoint signature and Pydantic models
- The in-memory session store class
- The SSE streaming logic in FastAPI

AI provides:
- The Gemini streaming wrapper
- Reference example of FastAPI SSE pattern (Riku adapts, doesn't copy)

```python
# Pseudocode — Riku implements
@app.post("/chat/turn")
async def chat_turn(req: TurnRequest) -> StreamingResponse:
    history = session_store.get_or_create(req.session_id)
    history.append({"role": "user", "content": req.message})

    async def gen():
        async for token in gemini_stream(MENTOR_PROMPT, history):
            yield f"data: {json.dumps({'token': token})}\n\n"
        # final event: full response committed to history
        history.append({"role": "assistant", "content": full_text})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
```

Test with `curl -N`:
```bash
curl -N -X POST http://localhost:8000/chat/turn \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test1", "message": "I want to learn about backprop"}'
```

You should see tokens streaming back, one chunk at a time.

#### LEARNING CHECKPOINT 1.2
AI asks:
> "What's the difference between SSE and WebSockets? Why did we pick SSE for streaming the mentor?"

Expected: SSE is one-way (server→client), simpler, works over HTTP, no special infra. WebSockets are bidirectional but overkill for our use case.

---

### Task 1.3 — Wire Langfuse tracing (~30 min)

Every `chat/turn` call is a Langfuse trace. Capture:
- The system prompt version
- Full input messages
- Streamed output (final concatenated)
- Latency, token counts, estimated cost
- Session ID as a metadata field (so you can group all turns of one session)

#### LEARNING CHECKPOINT 1.3
Open Langfuse. Find a single trace. AI asks:
> "If you wanted to know your average cost per session over the last 100 sessions, how would you query for it?"

If unfamiliar with Langfuse UI, AI walks through it.

---

### Task 1.4 — Frontend chat UI (~90 min)

A single page in `apps/web/src/app/chat/page.tsx`:
- Input box at the bottom
- Message history above
- Streaming animation as mentor types
- Two buttons: "Hint (locked for 30s)" and "Show answer (locked for 60s)" — non-functional for now, just visual

Use `EventSource` to consume the SSE stream. shadcn/ui components for styling.

#### MUST_WRITE_HIMSELF
- The streaming consumer logic (this teaches you SSE on the client side)
- The 30s countdown timer for the Hint button

AI provides:
- Component structure
- Tailwind utility class suggestions

#### LEARNING CHECKPOINT 1.4
AI asks:
> "Why does the Hint button have a 30-second countdown? What's the design intent? What would change about user behavior if we removed it?"

This is the moment to verify Riku internalizes the *pedagogy is the product* principle.

---

### Task 1.5 — The Self-Eval Ritual (~120 min) ⚠️ Critical

This is the most important task in this milestone. **Skip it and you'll build for 12 weeks on a broken foundation.**

Pick **3 paper concepts** from your curriculum (e.g., "what is backpropagation," "why do CNNs use pooling," "what's the vanishing gradient problem"). For each:

1. Open your chat UI.
2. Have a 10-turn conversation with the mentor as if you were a confused beginner.
3. Save the full transcript.

You now have 3 transcripts × ~10 turns = 30 mentor turns to grade.

Create `packages/eval/manual_grading_v0.md`. For each turn, score:

| Dimension | 0–2 | What it means |
|---|---|---|
| Asked-before-told | 0/1/2 | 0=lectured, 1=mixed, 2=led with question |
| One-question-per-turn | 0/1/2 | 0=stacked, 1=ambiguous, 2=clean |
| Withholding | 0/1/2 | 0=dumped answer, 1=partial, 2=appropriate restraint |
| Grade-appropriate language | 0/1/2 | 0=jargon-heavy, 1=mixed, 2=accessible |

Average score across 30 turns. **You need >75% (4.5/6.0)** before moving to Milestone 2.

If you score lower:
- Identify the worst category
- Revise the system prompt
- Re-run the same 3 conversations
- Re-grade

This loop continues until you hit the threshold. It's tedious. It's the moat.

#### LEARNING CHECKPOINT 1.5
At the end of this exercise, Riku must be able to articulate:
> "Here are the 3 prompt revisions I made. Here's why each one improved which dimension. Here's the one failure mode I still can't fix with prompting alone — which is why we'll need [agent state machine / structured outputs / RAG] in Milestone 2."

This articulation is the seed of your eventual blog post. Save it verbatim in BLOG_NOTES.md.

---

## Definition of Done

- [ ] `/chat/turn` streaming endpoint live (local + deployed)
- [ ] Frontend chat page consumes the stream and renders smoothly
- [ ] Langfuse traces every interaction with metadata
- [ ] System prompt v0 saved as a file, versioned
- [ ] 3 transcripts × 10 turns hand-graded
- [ ] Average score ≥ 75% on the rubric
- [ ] Prompt revision history documented in `prompts/mentor_changelog.md`
- [ ] BLOG_NOTES.md entry for Milestone 1 (~3 paragraphs)
- [ ] DECISION_LOG.md entry: "Chose SSE over WebSocket because…"

## What you've actually learned in this milestone

- Production prompt engineering (not "wrap in 'be helpful'")
- Streaming in FastAPI
- LLM observability fundamentals
- The discipline of self-evaluation (this is the rare skill)
- Why the *prompt* is part of the codebase and gets versioned like code

## Common pitfalls

- **"Good enough" prompt syndrome.** You'll be tempted to ship at 65% rubric score because "Gemini is dumb anyway." Resist. Iterate the prompt.
- **In-memory session store leakage.** Restart the server, history disappears. That's expected for v1. Note in DECISION_LOG that you'll move to Postgres in Milestone 2.
- **Streaming bugs in the browser.** SSE has gotchas (buffering, proxy, CORS preflight). Budget 1–2 hours of debugging. AI agent should walk you through `chrome://net-internals` debugging if it gets weird.

---

**Next:** `milestones/02-the-mentor-agent.md` — the biggest milestone. Where the simple LLM-call becomes a real agent with state.
