# Synthesis: consolidation, decisions, next action

## Consolidation ("where do we stand on H*?")

Task: consolidate the evidence for **one hypothesis** across all interviews.

Gather every `EV-*` item linked to the hypothesis by walking
`groundwork/interviews/` (procedure in `workspace.md`). Then:

- Do **NOT** conclude by majority vote. Weigh behaviour and commitment above
  opinion and compliments, per `scoring.md`.
- Distinguish explicitly between: compliments, general interest, claimed
  intent, past behaviour, existing investment, and concrete commitment.
- Produce a **conclusion** — `supported` / `partially_supported` /
  `inconclusive` / `contradicted` — with explicit reasoning that references
  the *pattern* of evidence (which kinds, from which segments), not the count.

Write into the hypothesis file's `## Consolidation` section (replace the
previous consolidation — it is a snapshot, dated):

- **Conclusion** + reasoning
- Relevant conversations (count) and matching segments (count)
- **Supporting** / **Contradicting** / **Unclear** — evidence ids with one-line
  gists
- **Patterns** — what recurs across interviews
- **Outliers** — who diverges and the observable trait that might explain it
- Common triggers · common workflows · common consequences
- Existing alternatives · existing spending
- **Commitment strength** — the strongest real commitments seen, in one line
- **Unanswered questions** — what the evidence cannot yet say
- **Recommended strength** — then actually run `scoring.md`, write the
  arithmetic table into `## Evidence score`, and update the frontmatter
  `strength` (computed) and `status` (conclusion). If your judgement disagrees
  with the computed strength, keep the computed value in `strength` and say
  why you disagree in the reasoning.

## Recording a decision

Task: recommend a decision for a hypothesis, given its consolidation. The
eight decision types:

| Value | Label |
|---|---|
| `continue_testing` | Continue testing |
| `narrow_segment` | Narrow the segment |
| `refine_hypothesis` | Refine the hypothesis |
| `test_related` | Test a related hypothesis |
| `proceed_to_solution` | Proceed to solution testing |
| `pause` | Pause |
| `reject` | Reject |
| `pivot` | Pivot |

Recommend one, with: **reasoning**, **remaining uncertainty**, and a
**suggested next test**. The founder owns the final call; you only advise.
Once the founder confirms (their choice may differ from yours — record
theirs), **append** an entry to `groundwork/decisions.md`:

- date · hypothesis · decision
- **Evidence basis** — the concrete evidence behind it, by id
- **Remaining uncertainty**
- **Next test**
- **What would change your mind** — required; a decision without a reversal
  condition is a belief, not a decision.

`decisions.md` is an append-only audit trail: never rewrite or delete past
entries.

## Next action ("what should I do next?" / "am I ready to build?")

Recommend the single most useful next step based on where validation is
thinnest — never on interview count. In order:

1. **No hypotheses** → define the first one: break the problem into a
   specific, testable claim and decide up front what would prove it wrong.
2. **No segments** → describe the group by observable traits, so the founder
   knows who to interview.
3. **No interviews** → plan one: generate a guide that digs into real past
   behaviour, then capture what was heard.
4. **Interviews but no extracted evidence** → extract classified,
   quote-backed evidence and tie it to hypotheses.
5. **Otherwise** → point at the hypothesis with the **thinnest** evidence
   (strength order: contradicted < none < weak < mixed < strong; break ties
   toward the hypothesis that gates the founder's stated decision).
   Recommend: consolidate what exists, then run interviews aimed squarely at
   the gap.

For "am I ready to build?" — answer from evidence strength per hypothesis
against the founder's own stated support thresholds and decision deadline,
and be direct about which hypotheses are unproven. Five compliments still
lose to two accounts of real spend.
