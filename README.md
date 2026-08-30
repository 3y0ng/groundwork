# Groundwork

**An evidence-based customer-discovery skill for Claude Code.**
Made by [Pyreel](https://pyreel.com) · MIT licensed.

Groundwork helps a founder move from

> "I think this is a problem."

to

> "I have credible evidence that a specific group experiences this problem
> frequently, urgently, and strongly enough to change their behaviour or pay
> for a solution."

It does that by making the *quality* of evidence visible, and by refusing to
let vague validation, compliments, hypotheticals, and leading questions
masquerade as proof.

Groundwork used to be a web app; it is now a [Claude Code](https://claude.com/claude-code)
skill. The methodology, the evidence weighting, and the interview coaching are
the same — but the AI is native, and your data is plain markdown in your own
repo instead of a browser's localStorage. (The app still exists in this
repository's git history.)

## Install

Personal (available in every project):

```bash
git clone https://github.com/3y0ng/groundwork ~/.claude/skills/groundwork
```

Or per-project: clone (or submodule) it into
`<your-project>/.claude/skills/groundwork`.

## Quickstart

Open Claude Code anywhere and say something like:

> Help me validate my startup idea with groundwork.

Claude will interview you about the problem, who has it, what you've already
heard, the decision you're facing, and your riskiest assumptions — then set up
a `groundwork/` workspace and guide you through the discovery loop:

1. State the problem (not the solution — it checks).
2. Break the belief into testable hypotheses, each with disconfirming
   evidence defined *before* you interview.
3. Identify and prioritise customer segments by observable traits.
4. Generate a targeted interview guide; check individual questions for
   weakness.
5. Log conversation notes with structured capture.
6. Extract classified, quote-backed evidence and tie it to hypotheses.
7. Get per-dimension interview-quality feedback, talk ratio, and missed
   follow-ups.
8. Consolidate evidence across interviews into a reasoned conclusion, with
   the scoring arithmetic shown.
9. Record a decision — continue, narrow, refine, proceed, pause, reject,
   pivot — with the evidence behind it and what would change your mind.

Your data is a directory of markdown files (`groundwork/` in whatever project
you run it from): human-readable, hand-editable, greppable, and versioned
with the rest of your repo. See a complete filled example in
[examples/creative-memory/](examples/creative-memory/).

## The methodology

Grounded in **The Mom Test** (Rob Fitzpatrick), alongside customer
development, lean startup experimentation, jobs-to-be-done interviews, and
evidence-based product discovery. No book text is reproduced; these are the
underlying ideas, expressed in Groundwork's own guidance:

1. **Ask about the past, not the future.** What someone *did* is evidence.
   What they *say they would do* is a prediction, and people are bad at it.
2. **Behaviour > opinion; commitment > enthusiasm.** Every piece of evidence
   is classified by kind and **weighted**. Compliments are worth zero.
   Contradictions subtract.
3. **Separate the problem from your solution.** Setup checks whether your
   problem statement is secretly a product pitch.
4. **Decide what would prove you wrong, first.** Each hypothesis requires
   disconfirming evidence before you interview.
5. **Evidence strength is not interview count.** Five compliments are weaker
   than two accounts of real spend. Consolidation never concludes by
   majority vote.
6. **Keep the original separate from the interpretation.** Verbatim quotes
   are stored apart from both your read and the AI's read.
7. **Frequency ≠ urgency ≠ willingness to pay.** Distinct hypotheses, tested
   separately.

## AI safety rules (baked into every task)

- Never fabricate a customer quote; quotes are verbatim from the notes.
- Never present weak evidence as fact; preserve uncertainty.
- Never treat compliments as validation or interview count as evidence
  quality.
- Always explain reasoning and point back to the source text.
- Always keep the founder's interpretation separate and easy to correct.
- The founder owns every decision; the skill only advises.

## Repository layout

```
SKILL.md          # entry point: rules, workspace handling, intent routing
references/       # methodology, scoring, workspace spec, task procedures
templates/        # skeletons for workspace files
examples/         # "Creative Memory": a complete filled workspace
```

Scoring is done as shown arithmetic in the hypothesis files themselves (see
`references/scoring.md`); if drift is ever observed in practice, a
deterministic `scripts/score.py` would be the natural addition.

## Migrating from the Groundwork app

Have a `groundwork-<name>.json` export from the old web app? Ask Claude to
"import my Groundwork JSON export" — the mapping lives in
`references/workspace.md`.

## What Groundwork deliberately does *not* do

No CRM, outreach automation, scheduling, call recording, or billing. The
point is the validation reasoning, not logistics.

---

Built by [Pyreel](https://pyreel.com), AI ad-creative and performance tooling
for founders and growth teams. Released under the MIT License.
