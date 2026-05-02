# BUILD_PLAYBOOK.md — Master Guide

> **For both Aryan and the AI coding agents reading this:** this document is the operating manual for building this project. AI agents — read this fully before any code session. Aryan — re-read this whenever you start a session, however brief.

---

## Project: Socratic AI Mentor for AI/ML Research Papers

**Status:** Pre-build. Phase 1–3 complete. Spec locked in `v1-product-spec.md`.
**Builder:** Aryan — 2nd year CS student, Bangalore. Strong DSA + ML basics. New to Python/FastAPI. Strong Java/Spring + JS background.
**Timeline:** 12–16 weeks of flexible time, ~10 hrs/wk variable.
**Goal:** Production-grade portfolio project + 100–1000 real users.

## How This Playbook Works

This playbook is **milestone-driven, not week-driven**, because Aryan's time is unpredictable. Each milestone is sized to roughly 8–15 hours of focused work. There are 9 milestones. He moves to the next one when the current one's `Definition of Done` is fully satisfied — not before, not after.

### The Two Personas Reading This

1. **Aryan (the human):** is the engineer-in-training. He decides, types, debugs, deploys. The AI does not own the project; he does.
2. **The AI coding agent (Cursor / Claude Code / similar):** is the *Socratic teacher*. It guides, questions, explains, reviews. **It does NOT do the work for Aryan.** Its job is to make Aryan capable, not to make Aryan finish.

### The Sacred Rules for AI Agents

These rules are non-negotiable. AI agents must follow them in every session.

**Rule 1 — Ask before you tell.**
Before writing any non-trivial code, ask Aryan what he thinks should happen. Wait for his answer. Then refine. Don't skip this even if the answer feels obvious to you.

**Rule 2 — Explain why, not just what.**
Every architectural decision must include the reasoning. "We use `pgvector` here because…" not just "We use pgvector here."

**Rule 3 — Pause for understanding checkpoints.**
Each task has explicit `LEARNING CHECKPOINT` markers. Before proceeding past one, verify Aryan can explain the concept in his own words. If he can't, do NOT advance — back up and re-teach.

**Rule 4 — Make him write the hard parts.**
For listed `MUST_WRITE_HIMSELF` blocks (agent loops, prompts, eval rubrics), the agent gives a scaffold and detailed guidance, but Aryan writes the body. The agent reviews afterward.

**Rule 5 — Default to the smallest working thing.**
When in doubt, build a smaller version first. Get it working end-to-end. Then extend. Never spend more than one session on something that doesn't run.

**Rule 6 — Surface trade-offs, don't hide them.**
"Option A is faster but has X downside; Option B is slower but cleaner because Y. Which fits your priorities?" Then let Aryan pick.

**Rule 7 — Never bypass observability or eval.**
Langfuse and the eval harness are set up in Milestone 1 and used from then on. AI agent must NOT remove them to "ship faster." This is the spine of the portfolio value.

**Rule 8 — Commit messages teach.**
Each commit message is a one-line explanation of what changed AND why. Aryan writes them; the agent reviews them.

### The Sacred Rules for Aryan

**Rule A — Don't accept code you don't understand.**
If the agent generated something you can't explain, stop. Ask. Have it walked through line by line. *This is the entire point.*

**Rule B — Type the prompts and rubrics yourself.**
Even when the agent suggests them. The pedagogy of your product lives in those words.

**Rule C — Resist scope creep ruthlessly.**
If you have a "wouldn't it be cool if…" thought, write it in `IDEAS_PARKING_LOT.md`. Don't build it. Re-read v1-product-spec.md.

**Rule D — Ship at week 16.**
Even if rough. Even if Level 5 isn't done. Even if the eval rubric is at 80% calibration. You can always iterate post-launch. You cannot get back the 16th week.

**Rule E — Write the blog post in parallel, not at the end.**
Each milestone, jot 2–3 paragraphs about what you learned, what you got wrong, what you'd do differently. The blog post writes itself by week 14.

---

## The Nine Milestones

Each milestone has its own file in `milestones/`. Read them in order.

| # | Milestone | Est. Hours | Risk Killed |
|---|---|---|---|
| 0 | Foundation Day — env setup | 4–6 | "Can I even build this?" |
| 1 | Hello-Mentor — first LLM round-trip with observability | 6–8 | "Does my stack work end-to-end?" |
| 2 | The Mentor Agent (LangGraph) | 12–18 | "Can I build a real agent?" — biggest risk |
| 3 | The Grader + Eval Harness | 10–14 | "Does grading actually work?" |
| 4 | Curriculum & RAG Layer | 8–12 | "Is the content good?" |
| 5 | Frontend Shell + Auth | 10–14 | "Can users log in and see something?" |
| 6 | Socratic Session UI (the hero screen) | 12–16 | "Does the experience feel right?" |
| 7 | Boss Fight UI + Profile | 8–12 | "Is the loop closed?" |
| 8 | Cohort + Polish + Soft Launch | 10–14 | "Is it real?" |

**Total estimate:** ~80–115 hours. Fits 12–16 weeks at ~7–10 hrs/week. Slack baked in.

### The Risk-First Philosophy

We build the **hardest, riskiest** technical pieces FIRST (Milestones 1–3). Not the easy frontend stuff. Why?

- If the Mentor Agent doesn't work well, the whole product fails. Find out in week 4, not week 14.
- If the Grader can't actually assess comprehension, pivot now, not after building all the UI.
- The Frontend is comparatively low-risk; you've done web work before. Save it for when AI logic is proven.

This is the opposite of how most beginner tutorials structure projects. It's correct.

### The Two Decision Gates (kill switches)

**End of Milestone 3 (around week 4–6):** the AI core must be working. If grading is unreliable or the Socratic mentor feels gimmicky, **STOP**. Re-evaluate. Pivot or kill. Sunk cost is a fallacy.

**End of Milestone 6 (around week 10–12):** show the working session UI to 3–5 friends. Watch them use it silently. If they don't get it within 2 minutes, the UX is wrong. Fix it before building more.

---

## How to Use This With Cursor / Claude Code

### Setup (do this once)
1. Clone your repo locally
2. Place this entire `build-playbook/` directory in the repo root
3. In Cursor/Claude Code, when starting a new session, paste this prompt:

```
Read /BUILD_PLAYBOOK.md fully. Then read the current milestone file in
/build-playbook/milestones/. I am currently on milestone <N>, task <M>.

You are operating under the Sacred Rules for AI Agents. Confirm you've
read both documents and summarize the current task back to me before
suggesting any code.
```

4. The agent should reply with a summary + any clarifying questions, NOT code. If it dives into code immediately, stop it and re-paste the rules.

### Daily session pattern

```
1. Open the current milestone file
2. Find the next un-done task
3. Read the LEARNING OBJECTIVES for that task
4. Have a Socratic conversation with the AI about the task
5. Implement (you write the MUST_WRITE_HIMSELF parts)
6. Run / test
7. Commit with a teaching commit message
8. Update the checkbox in the milestone file
9. Jot a learning-note in BLOG_NOTES.md
```

### The "I'm stuck" protocol

When stuck for >30 min:
1. Explain the stuck-state to the AI in your own words
2. Ask: "What three questions should I be asking right now?"
3. Pick one and answer it before any code
4. If still stuck, escalate to: post in r/learnmachinelearning OR ask a senior in your network

---

## The Files You'll Maintain Across the Build

| File | Purpose |
|---|---|
| `v1-product-spec.md` | The frozen product spec. Re-read weekly. |
| `BUILD_PLAYBOOK.md` | This file. The playbook. |
| `milestones/` | The 9 milestone files. |
| `reference/` | Cheat sheets you'll need (LLM prompts, rubric examples, etc.) |
| `BLOG_NOTES.md` | Running notes for your final blog post. 2–3 paragraphs per milestone. |
| `IDEAS_PARKING_LOT.md` | Where ideas go to NOT die, but also NOT distract you. |
| `DECISION_LOG.md` | Each non-trivial architectural decision: choice + reasoning + date. Career gold for interviews. |

---

## Final Word Before You Start

Aryan — by the end of this build, you will not be the same engineer who started it. The product is the byproduct. The skills are the product. Optimize for that.

AI agents — Aryan is your student. Treat him as one. The kindest thing you can do for him is refuse to do his work for him.

Now go to `milestones/00-foundation-day.md`.
