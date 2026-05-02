# Paper Narrative Template

> Use this when writing a Socratic narrative for a paper. AI generates a draft following this template; Riku edits.

## Frontmatter (required)

```yaml
---
id: <paper-slug>
title: <paper title>
authors: [<author1>, <author2>]
year: <year>
level: <1-5>
prerequisites: [<concept-id>, ...]
key_concepts: [<concept-id>, ...]
estimated_session_minutes: 30
pedagogical_arc:
  - "<question 1 — opens the inquiry>"
  - "<question 2 — pushes deeper>"
  - "<question 3 — reveals the key insight>"
---
```

## Section structure

A narrative has 4–7 sections, each ~300–500 words. Sections map to the mentor agent's `current_section` counter — when the agent advances, it moves to the next section.

Each section has:

```markdown
## Section N: <evocative title>

### The setup
<1–2 paragraphs giving the question this section answers, framed as a puzzle>

### Probe
<a Socratic question for the mentor to ask, before revealing>

### The reveal
<the actual technical content, written conversationally>

### Common confusions
<2–3 misconceptions a beginner has here, so the mentor can detect them>

### Connection to next section
<bridge sentence>
```

## Tone

- Conversational, not stuffy.
- Use concrete examples before abstractions.
- Use analogies sparingly — once per section max.
- Equations: render with `$...$` (inline) or `$$...$$` (block). Always followed by 1-sentence intuition.
- Cite the original paper section/figure when relevant: "(see Figure 2 in the paper)".

## Worked example: opening of an AlexNet narrative

```markdown
## Section 1: Why was vision hard before 2012?

### The setup
For decades, the dream of "show a computer a photo and have it tell you
what's in it" was treated as basically impossible. Hand-engineered features
like SIFT and HOG were the state of the art. They were brittle. They needed
PhDs to design. And on the ImageNet benchmark — 1.3M images, 1000 categories
— the best systems hovered around 26% top-5 error. Then in 2012, AlexNet
hit 15.3%. The field never looked the same.

So before we get to *what* AlexNet did, let's first understand: what made
this problem so hard that decades of effort had only inched it forward?

### Probe
Before reading on — pause. What about photos do you think makes them
genuinely hard for a computer compared to, say, structured data like a
CSV row?

### The reveal
The answer comes down to three things: pixel correlation,
translation/scale variance, and combinatorial explosion of object
appearance...

### Common confusions
- "Why not just match pixel patterns?" — pixel-level matching fails because the
  same object in two photos has nearly zero pixel overlap (lighting, angle).
- "Why not use existing image features?" — SIFT/HOG features capture LOW-level
  texture patterns; the SEMANTIC level (this is a cat) needs hierarchical
  abstraction.

### Connection to next section
This is exactly what 'deep' enables — and is why the depth of AlexNet
mattered as much as its width.
```

## Anti-patterns (banned)

- ❌ Long paraphrases of paper abstracts. Be original.
- ❌ Wikipedia-style "first this, then this" prose. Always have a question driving forward.
- ❌ Listing equations without intuition.
- ❌ Apologizing for math ("don't worry if this looks scary").
- ❌ Overpromising ("by the end of this you'll fully understand transformers"). Promise less, deliver more.
