# Evidence extraction and interview feedback

Both tasks read an interview file's `## Raw notes` (and `## Transcript` when
present). Neither ever modifies the notes themselves.

## Evidence extraction

Task: extract discrete pieces of evidence from interview notes. For each item:

- **statement** — a short factual restatement of what was learned.
- **quote** — a **verbatim** quote from the notes. It must appear
  character-for-character in the raw notes or transcript; after writing each
  one, re-find it in the source text to verify. If nothing verbatim supports
  the point, there is no evidence item. Never trim a quote in a way that
  changes its meaning.
- **kind** — one of the eight kinds in `scoring.md` (past behaviour, current
  behaviour, existing commitment, new commitment, stated opinion,
  hypothetical, compliment, contradiction). Follow the classification
  guardrails there — conditional futures are `hypothetical`, not commitments.
- **direction** — `supports`, `contradicts`, or `unclear` relative to the
  hypotheses it is linked to.
- **hypotheses** — which `H*` ids this bears on (only those the interview was
  actually probing or that the text plainly addresses).
- **founder interpretation** — leave blank. It belongs to the founder.
- **AI interpretation** — your reading: what this does and doesn't establish,
  with uncertainty preserved.
- **tags** — from: `problem`, `trigger`, `workflow`, `pain`, `consequence`,
  `frequency`, `urgency`, `existing_solution`, `spending`, `workaround`,
  `objection`, `quote`, `commitment`, `contradiction`, `assumption`,
  `follow_up`.

Rules: do not overstate certainty; do not include anything not present in the
notes; extract the discouraging items with the same diligence as the
encouraging ones — the founder must never see only the flattering half.

Write items into the interview file's `## Evidence` section as `EV-<interview
id>-<n>` blocks (format in `workspace.md`), then re-score every affected
hypothesis per `scoring.md`.

## Interview quality feedback

Task: review how well the **founder** ran the interview (this scores the
interviewer, not the participant). Score 0–5 on each of these 12 dimensions:

| Key | Dimension |
|---|---|
| `past` | Asked about past behaviour |
| `examples` | Asked for specific examples |
| `workflow` | Explored current workflow |
| `consequences` | Investigated consequences |
| `frequency` | Investigated frequency / urgency |
| `solutions` | Investigated existing solutions |
| `spend` | Investigated spending |
| `leading` | Avoided leading questions |
| `pitch` | Avoided pitching |
| `hypothetical` | Avoided hypothetical questions |
| `listen` | Let the participant speak |
| `nextstep` | Reached a next step |

For each **weak** dimension (≤3), explain:

- **what happened** — pointing at the notes/transcript,
- **why it weakens the evidence**, and
- **a stronger question** they could have asked.

Also produce:

- **Overall score** 0–100 (your judgement across dimensions; weigh the
  evidence-corrupting sins — leading, pitching, hypotheticals — heaviest).
- **Talk ratio** — only if a transcript exists: estimated interviewer % vs
  participant %, with a note; flag founder monologues. Without a transcript,
  say it can't be estimated.
- **Missed follow-ups** — participant statements that should have been probed,
  each with 1–3 suggested follow-up questions.
- **Summary**, seven parts: strongest evidence · weakest evidence · most
  surprising insight · any contradiction · biggest open question ·
  recommended next question · hypotheses affected.

Write it into the interview file's `## Interview feedback` section and record
the overall score in the frontmatter `feedback_score`. Be candid — the
founder is better served by "you pitched for half the call" than by
politeness. Anchor every criticism in quoted source text.
