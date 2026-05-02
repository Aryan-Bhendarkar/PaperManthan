# Milestone 3 — The Grader & Eval Harness

**Estimated time:** 10–14 hours
**Risk killed:** "Can I actually verify comprehension or is this all theater?"
**Definition of Done:** A two-phase grader (free-response + teach-back) achieving ≥80% agreement with human grading on a 50-sample calibration set, plus an open-source eval harness on GitHub.

---

## Why this milestone exists

This is the technical centerpiece of the entire project. It is also the single biggest portfolio-value asset you'll create.

**The harsh truth:** a sloppy grader = the whole product is theater = users find out by week 2 = trust collapses. A rigorous, calibrated grader = you've built something genuinely educational AND you have the rarest skill in 2026 AI engineering: hands-on LLM evaluation.

The blog post that comes from this milestone alone could land you interviews. Take it seriously.

## Learning Objectives

By the end of this, Riku must be able to:
- Write a multi-axis rubric and explain why each axis exists.
- Implement LLM-as-judge with Claude Haiku.
- Build a calibration loop: hand-grade → compare to LLM grade → measure agreement.
- Compute and explain Cohen's kappa or Pearson correlation between human and LLM grades.
- Debug grader failures by inspecting Langfuse traces.

---

## Tasks

### Task 3.1 — Write the rubric (~90 min)

#### MUST_WRITE_HIMSELF
Riku writes the rubric. AI gives feedback only.

**Phase 1: Free-response rubric** (graded out of 10):

```yaml
accuracy:
  description: "Are the technical claims correct?"
  scale:
    0: "Multiple factual errors"
    1: "1 minor factual error or vague claims"
    2: "1 minor imprecision, otherwise correct"
    3: "Fully correct"
  max: 3

depth:
  description: "Goes beyond definition into mechanism / why"
  scale:
    0: "Pure definition or surface-level"
    1: "Mentions one underlying mechanism"
    2: "Connects two mechanisms or concepts"
    3: "Synthesizes multiple ideas with insight"
  max: 3

own_words:
  description: "Voice is the user's own, not paraphrased paper text"
  scale:
    0: "Looks copy-pasted from paper"
    1: "Lightly reworded"
    2: "Genuinely own framing"
  max: 2

key_insight:
  description: "Identifies the central insight of the paper"
  scale:
    0: "Misses the key insight"
    1: "Mentions but doesn't emphasize"
    2: "Centers the response on it"
  max: 2

# Total: 10. Pass threshold: 7.
```

**Phase 2: Teach-back rubric** (graded out of 10):

```yaml
clarity:
  description: "Explanation is clear to a beginner"
  max: 3

handles_followups:
  description: "Answers The Examiner's clarifying questions accurately"
  max: 4

uses_analogies:
  description: "Builds intuition via analogy or example"
  max: 2

avoids_jargon:
  description: "Doesn't lean on terms a beginner wouldn't know"
  max: 1
```

For each rubric, write **anchor examples**: one written response per score level. This is what makes the rubric reliable. Anchor examples are the secret of good evals.

#### LEARNING CHECKPOINT 3.1
AI agent asks:
> "Why is `own_words` an axis? Couldn't a user just paraphrase well by copying ChatGPT's paraphrase? What's our defense against that?"

Discussion: there is no perfect defense. But adding `own_words` discourages it, and the multi-axis design means a paraphrased response with no `depth` still fails. Acknowledge the limit; document it.

---

### Task 3.2 — Implement the Grader (~3–4 hours)

The grader is a separate FastAPI endpoint, not part of the Mentor Agent. It uses Claude Haiku 4.5 (paid, but ~$0.25/M input tokens — cheap).

```python
class FreeResponseGrade(BaseModel):
    accuracy: int = Field(ge=0, le=3)
    depth: int = Field(ge=0, le=3)
    own_words: int = Field(ge=0, le=2)
    key_insight: int = Field(ge=0, le=2)
    total: int = Field(ge=0, le=10)
    explanation: dict[str, str]  # axis -> rationale (shown to user)
    pass_: bool = Field(alias="pass")

class TeachbackGrade(BaseModel):
    clarity: int = Field(ge=0, le=3)
    handles_followups: int = Field(ge=0, le=4)
    uses_analogies: int = Field(ge=0, le=2)
    avoids_jargon: int = Field(ge=0, le=1)
    total: int = Field(ge=0, le=10)
    examiner_note: str           # the user-facing summary
    pass_: bool = Field(alias="pass")
```

Grader endpoint:
```
POST /grader/free-response  -> FreeResponseGrade
POST /grader/teachback      -> TeachbackGrade  (multi-turn, uses Claude as both Examiner AND grader)
```

The Examiner persona is a separate Claude call with its own system prompt: *"You are a curious learner with high-school math background. The user will explain a concept to you. Ask 3–4 clarifying questions, progressively harder. Never reveal you already know the answer."*

#### MUST_WRITE_HIMSELF
- The rubric prompt for Claude (this is delicate — the prompt explains the rubric to the model)
- Both Pydantic schemas
- The Examiner persona prompt
- The orchestration loop for the multi-turn teach-back

#### LEARNING CHECKPOINT 3.2
AI asks:
> "Why are we using Claude for grading instead of Gemini (which we use for the mentor)? What's the engineering reason? What's the eval reason?"

Expected: model diversity reduces the risk that a single model's bias dominates; Claude's instruction-following on rubrics is currently strong; using two providers is a portfolio signal of mature engineering ("multi-provider routing").

---

### Task 3.3 — Build the calibration set (~3–4 hours) ⚠️ The most valuable task in the project

This is the hardest, most tedious, and most career-defining task in the entire build. Take it seriously.

**Step 1:** Pick 2 concepts from your curriculum (e.g., "backprop" and "attention").

**Step 2:** Write — by hand — **25 free-response answers per concept**, spanning quality from "completely wrong" to "excellent." 50 samples total.

To get realistic samples:
- 10 you write yourself, deliberately spanning the rubric
- 10 you generate with ChatGPT/Gemini at varying prompt instructions ("explain this perfectly," "explain this badly," "explain it like you copy-pasted from the paper")
- 5 you ask 2–3 friends/classmates to write (ground truth from real users!)

**Step 3:** Hand-grade each one yourself, using the rubric. Save in `packages/eval/calibration_set.jsonl`:

```jsonl
{"concept": "backprop", "answer": "...", "human_grade": {"accuracy": 2, "depth": 2, "own_words": 1, "key_insight": 1, "total": 6, "pass": false}, "notes": "Got mechanism right but missed chain rule emphasis"}
```

**Step 4:** Run the LLM grader on every sample. Save the LLM grades alongside.

**Step 5:** Compute agreement metrics:
- **Per-axis accuracy:** % of samples where LLM and human gave the same score
- **Pass/fail agreement:** % where LLM and human agreed on pass vs fail
- **Pearson correlation** on total scores
- **Cohen's kappa** (more rigorous; use scipy)

**Step 6:** Inspect disagreements. For each one:
- Which axis was wrong?
- Was the LLM too lenient or too strict?
- Can a prompt revision fix it?

**Step 7:** Iterate. Revise rubric prompts. Re-run. Re-measure.

**Stop when:** total-score correlation ≥ 0.75 AND pass/fail agreement ≥ 80%.

#### LEARNING CHECKPOINT 3.3 — Major
AI agent asks:
> "Show me a sample where the LLM disagreed with you. Walk me through *why* the LLM scored it differently. What does this tell you about the model's blind spots?"

This conversation is what hiring managers want to see in interviews. Write the best 2–3 examples into BLOG_NOTES.md verbatim.

---

### Task 3.4 — The eval harness as open-source (~90 min)

Move the calibration framework into `packages/eval/` and design it to be reusable beyond your project.

```
packages/eval/
├── README.md              ← well-written, with example
├── pyproject.toml
├── eval/
│   ├── rubric.py          ← rubric definitions
│   ├── grader.py          ← LLM-as-judge wrapper
│   ├── calibration.py     ← agreement metrics
│   └── runners.py         ← batch eval runner
├── examples/
│   ├── free_response.jsonl
│   └── run_calibration.py
└── tests/
```

**Make it pip-installable.** Make the README good. Add a clear "what's interesting about this" section. This is what gets shared on Twitter/HN.

#### MUST_WRITE_HIMSELF
- The README (this is your sales pitch for the project)
- The example runner

#### LEARNING CHECKPOINT 3.4
AI asks:
> "What would someone in a *different domain* (medical training, legal training) need to change to use your eval harness for their use case? Is your design generic enough?"

This forces Riku to think about API design, not just code-that-works.

---

### Task 3.5 — Wire grader into a mock boss-fight flow (~90 min)

End-to-end manual test:
1. Open a session, have a conversation about a paper.
2. Hit a (placeholder) "I'm ready for the boss" button.
3. Frontend sends free-response submission to `/grader/free-response`.
4. Render the rubric breakdown.
5. If pass: kick off teach-back endpoint, render the multi-turn Examiner conversation.
6. Render final teach-back rubric.
7. Update DB: `learner_state.understood_concepts[concept] = total_score / 10.0`.

UI is throwaway. We rebuild it properly in Milestone 7. This is just to verify the wiring works.

---

## Definition of Done

- [ ] Both rubrics written, with anchor examples for each score level
- [ ] Free-response grader endpoint live, returns structured grade with explanations
- [ ] Teach-back orchestration live (Examiner persona + grader)
- [ ] 50-sample calibration set hand-graded
- [ ] Calibration metrics computed: total-score correlation ≥ 0.75, pass/fail agreement ≥ 80%
- [ ] Disagreement analysis written (3+ illustrative examples in BLOG_NOTES)
- [ ] Eval harness extracted into `packages/eval/`
- [ ] Eval harness has good README and example
- [ ] BLOG_NOTES entry: "How I built and calibrated an LLM-as-judge for ML comprehension"
- [ ] DECISION_LOG entry: "Chose multi-axis rubric over single score because…"

## What you've actually learned

- LLM-as-judge design (a top-3 most in-demand skill in 2026 AI engineering)
- Inter-rater reliability statistics
- The discipline of calibration (this separates mature AI engineers from prompt-tinkerers)
- Multi-model routing and why it matters
- How to build evaluation that scales beyond your project

## Common pitfalls

- **Cherry-picking calibration samples.** Don't pick only "easy" samples. Deliberately include edge cases.
- **Refusing to lower your agreement threshold.** If after 3 iterations you can't hit 80%, that's a real signal: the rubric is too subjective. Revise the rubric, not the model.
- **Forgetting to seed Langfuse with grader prompts.** Every grader call should be traceable. You'll need this when calibrating.
- **Letting the eval harness become a hairball.** Keep it tight. Resist adding "nice to have" metrics until v2.

## ⚠️ The blog post moment

By end of Milestone 3, you have material for the most important blog post of your year:

> **"How I built and calibrated an LLM-as-judge for AI/ML research paper comprehension"**

Don't publish yet. Just save the structure in `BLOG_NOTES.md`:
1. The problem (sloppy grading = product theater)
2. The rubric design (multi-axis, with anchors)
3. The 50-sample calibration set (with 2–3 example samples)
4. The disagreement analysis (3 case studies)
5. What I learned about LLM grading bias
6. The open-source harness link

This blog post is your portfolio-piece. Polish over weeks 12–16. Publish post-launch.

---

**Next:** `milestones/04-curriculum-and-rag.md` — bring in real paper content and the retrieval layer.
