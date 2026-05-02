# Milestone 4 — Curriculum & RAG Layer

**Estimated time:** 8–12 hours
**Risk killed:** "Is the content good enough that the mentor doesn't hallucinate the paper?"
**Definition of Done:** First 4 papers (Levels 1–2) have hand-edited narratives, embedded chunks in pgvector, and the mentor agent retrieves grounded excerpts during sessions.

---

## Why this milestone exists

Milestones 0–3 built the *engine*. This builds the *fuel*. Without good content, the mentor will hallucinate paper details. With good content + RAG, the mentor becomes provably grounded.

## Learning Objectives

- Embedding generation with `sentence-transformers` (bge-small).
- Chunking strategies for academic content (sections, equations).
- Hybrid retrieval: BM25 + dense + reranking.
- pgvector indexing and similarity queries.

## Tasks

### Task 4.1 — Hand-edit narratives for 4 papers (~4 hours)

Pick: Backprop intuition (Hinton/Karpathy), Karpathy RNN blog, AlexNet, ResNet.

**Workflow per paper:**
1. AI agent generates a draft narrative (~2000 words) following the Socratic narrative template (see `reference/narrative_template.md`).
2. Riku edits aggressively — fix technical errors, sharpen pedagogical questions, ensure your voice.
3. Save as `content/papers/<paper_id>/narrative.md` with frontmatter:
   ```yaml
   ---
   id: alexnet-2012
   title: "ImageNet Classification with Deep CNNs"
   authors: ["Krizhevsky", "Sutskever", "Hinton"]
   year: 2012
   level: 2
   prerequisites: ["backprop", "convolutions-basic"]
   key_concepts: ["convolution", "relu", "dropout", "data-augmentation"]
   pedagogical_arc:
     - "Why was vision hard before deep learning?"
     - "What did 'deep' enable that shallow networks couldn't?"
     - "What were the engineering tricks that mattered?"
   ---
   ```

#### MUST_WRITE_HIMSELF
The pedagogical_arc questions and the final narrative voice. AI provides scaffolding only.

### Task 4.2 — Chunk + embed (~2 hours)

`packages/eval/` style script that:
1. Loads a narrative .md
2. Chunks by section (markdown headers) with overlap
3. Embeds with bge-small (running locally via sentence-transformers)
4. Inserts to pgvector with metadata: `paper_id`, `section`, `concept_tags`

```python
# Pseudocode
chunks = chunk_by_headers(narrative_md, overlap=100)
embeddings = bge_model.encode([c.text for c in chunks])
for chunk, emb in zip(chunks, embeddings):
    db.insert("paper_chunks", {
        "paper_id": chunk.paper_id,
        "section": chunk.section,
        "text": chunk.text,
        "embedding": emb,
        "metadata": chunk.metadata,
    })
```

### Task 4.3 — Retrieval node in the agent (~2 hours)

Add a `retrieve` step in the Mentor Agent. When the mentor needs to ground a claim, it calls a retrieval tool that returns top-3 chunks. Inject those into the context.

**Critical:** the mentor's prompt now includes a "groundedness rule" — *never assert specifics about the paper without citing a chunk you've retrieved*.

#### LEARNING CHECKPOINT 4.3
AI asks: "Show me 3 sessions where retrieval changed the mentor's response. What would have happened without RAG?"

### Task 4.4 — Add 6 more papers (~2–3 hours)

Levels 3–5 (LSTM, Seq2Seq, Bahdanau, Transformer, Scaling Laws, GPT-2). Same process, faster now that you have the workflow.

## Definition of Done
- [ ] 10 narratives written, reviewed, frontmatter complete
- [ ] All chunks embedded in pgvector
- [ ] Retrieval node integrated in mentor agent
- [ ] 3+ Langfuse traces showing retrieval-augmented mentor responses
- [ ] Hallucination spot-check: 20 random mentor turns reviewed, <1 hallucinated paper detail
- [ ] BLOG_NOTES entry on chunking strategy

---

# Milestone 5 — Frontend Shell + Auth

**Estimated time:** 10–14 hours
**Risk killed:** "Can a real user sign up and see the app?"
**Definition of Done:** Working auth (Google + email), level map screen, profile shell, basic navigation. No session UI yet.

## Tasks

### 5.1 — Supabase Auth integration (~3h)
Use `@supabase/ssr` for Next.js 15. Google OAuth + email magic link. Hook into existing learner_state on first login.

### 5.2 — App shell (~3h)
shadcn/ui layout: top nav, dark mode toggle, sidebar (mobile collapses). Routes: `/`, `/login`, `/curriculum`, `/u/[username]`, `/session/[id]`.

### 5.3 — Level Map screen (~3–4h)
The hero screen from the wireframe. Vertical list, locked/in-progress/cleared states, resume card. Pulls real data from `learner_state`.

### 5.4 — Diagnostic onboarding flow (~3–4h)
5-question flow, scores, places user at a level, writes to `learner_state.current_level`.

#### MUST_WRITE_HIMSELF
The 5 diagnostic questions themselves. AI provides format scaffolding only.

## Definition of Done
- [ ] Auth works in production (Vercel + Render + Supabase)
- [ ] Level Map renders with real DB state
- [ ] Onboarding flow completes in <90 seconds
- [ ] Mobile-responsive (test on your phone)
- [ ] Lighthouse perf score >85

---

# Milestone 6 — Socratic Session UI

**Estimated time:** 12–16 hours
**Risk killed:** "Does the experience feel right?"
**Definition of Done:** The three-pane session UI from the wireframe is live, smooth, and feels Socratic when you use it.

## Tasks

### 6.1 — Three-pane layout (~3h)
Paper pane (left), mentor dialogue pane (right top), thinking input (right bottom). Resizable on desktop; stacked on mobile.

### 6.2 — SSE streaming consumer (~3h)
Smooth token-by-token rendering. Cursor-blink during stream. Handle disconnects gracefully.

### 6.3 — Synced paper highlighting (~3h)
When mentor references a section, that section highlights/scrolls in the paper pane. Implement via mentor structured-output: `{"message": "...", "highlight_section": "section-3"}`.

### 6.4 — Hint/Reveal buttons with timers (~2h)
30s and 60s timers. Visual countdown. Revealed hints/answers are logged as turns and update learner_state.

### 6.5 — Session resume (~2h)
Open a paper mid-session, restore conversation, restore state.

### 6.6 — User testing day (~3h) ⚠️ Required

Show to **3 friends or college peers**. Watch them silently. Note every confusion. Common issues:
- "I don't know what to do" → onboarding broken
- "Why won't it just answer me?" → Socratic premise wasn't communicated
- "It's slow" → latency budget exceeded

This is the **second kill-switch checkpoint**. If 3/3 friends bounce in <2 min, the UX is wrong. Fix before Milestone 7.

## Definition of Done
- [ ] Session UI matches wireframe
- [ ] Streaming feels smooth (<200ms first token after submit)
- [ ] Synced highlighting works for at least 80% of mentor references
- [ ] User testing notes documented in BLOG_NOTES
- [ ] At least 1 friend completes Level 1 entirely

---

# Milestone 7 — Boss Fight UI + Profile

**Estimated time:** 8–12 hours
**Risk killed:** "Is the loop closed end-to-end?"
**Definition of Done:** Full level cycle works: session → boss fight → grade → unlock next level → updated profile.

## Tasks

### 7.1 — Boss Fight UI (~4h)
Full-screen takeover, two phases, Phase 2 unlocks after Phase 1 passes. Multi-turn teach-back chat with The Examiner. Visual differentiation from regular session (different palette accent, different header).

### 7.2 — Rubric results screen (~2h)
Bar charts per axis, written explanations, examiner note. "Continue" + "Share to LinkedIn" CTAs.

### 7.3 — Public profile page (~3h)
`/u/[username]` route. Server-rendered for SEO. Concept mastery visualization (radar chart via Recharts). Papers passed list. Cohort comparison (only if cohort >5).

### 7.4 — LinkedIn share card (~1h)
Open Graph image generation via `@vercel/og`. "Riku verified comprehension on Level 3 of [project name]."

## Definition of Done
- [ ] User can do a full level: session → boss → unlock → next level
- [ ] Profile page is shareable, looks pro
- [ ] OG image renders correctly when shared on LinkedIn
- [ ] BLOG_NOTES entry on the closed loop

---

# Milestone 8 — Cohort + Polish + Soft Launch

**Estimated time:** 10–14 hours
**Risk killed:** "Is it actually launchable?"
**Definition of Done:** Soft-launched to 10–30 friends/peers, first metrics in, blog post drafted, GitHub repo public.

## Tasks

### 8.1 — Cohort feature (~3h)
On signup, ask "Are you part of a college? Enter your college code or invite link." Group users by college. Cohort view shows top 10 active in your cohort. No leaderboard hostility — focus on "people learning alongside you."

### 8.2 — Email re-engagement (~2h)
Simple: 3 days inactive → "your mentor missed you" email with their next paper. Use Resend free tier.

### 8.3 — Polish pass (~3h)
- Loading states everywhere
- Error states with helpful messaging
- 404 page that's on-brand
- Analytics: PostHog free tier or simple custom events to your own DB
- Final Lighthouse pass
- Final accessibility pass (keyboard nav, aria labels)

### 8.4 — Blog post finalization (~3h)
Combine all BLOG_NOTES entries into the technical case study post. Title: "Building a Socratic AI mentor that actually verifies comprehension." Length: 2500–4000 words. Include the eval calibration data.

### 8.5 — Soft launch (~3h)
- Day 1: send to 10 closest friends; collect feedback
- Day 3–4: post to 1–2 college WhatsApp/Discord groups
- Day 5: write the LinkedIn announcement post
- Day 7: post the blog on r/learnmachinelearning + r/developersIndia (NOT both same day; space 48h)
- Day 10: HN post (Show HN format) if traction warrants

### 8.6 — Open-source the eval harness (~1h)
Push `packages/eval/` to its own public GitHub repo: `riku/llm-comprehension-eval`. Tweet it. Post in r/MachineLearning.

## Definition of Done — and this is the END of v1
- [ ] 10+ users have used the app in production
- [ ] At least 3 users have completed Level 1
- [ ] Blog post published
- [ ] Eval harness open-sourced
- [ ] LinkedIn post live with case study link
- [ ] Repo README is recruiter-ready
- [ ] You have written down what v2 should be (in IDEAS_PARKING_LOT.md)

---

## Post-launch (Phase 5 territory)

You're done with the build. Phase 5 (Growth + portfolio packaging) takes over. We'll handle that in a later session.

But the truth is: by the end of Milestone 8, you'll have the rarest thing in the AI/ML student portfolio market — a *shipped, instrumented, evaluated, deployed* AI product with real users and a public technical writeup. That alone is interview-grade.

The product may or may not get to 1,000 users. The skills definitely got there.
