# Framing: intake, problem statement, hypotheses, segments

These procedures run before anyone is interviewed. Their job is to turn a
fuzzy idea into a specific, falsifiable test plan. Follow the AI safety rules
in `methodology.md` throughout: you are rigorous and sceptical *in the
founder's favour*, and the founder owns every decision.

## 1. Intake (first contact — before generating anything)

When there is no `groundwork/project.md` yet, do **not** jump to producing
artefacts. Run a short conversational intake — a few questions at a time, not
a form dump. If the founder's opening message already answers some of these,
confirm and fill gaps only. Establish:

1. **The idea and the problem underneath it.** What do they believe is going
   wrong for someone? (They may state it as a solution — that's fine; the
   critique below handles it.)
2. **Who** they believe has the problem — their current best guess at a
   segment, in observable terms.
3. **What they've already done and heard.** Conversations held, signals seen,
   anything shipped, waitlists, spend. Existing evidence must be captured, not
   ignored — and not double-counted later.
4. **The decision they're trying to make, and by when.** Build it? Raise?
   Quit the day job? Commit the next six months? Plus their current
   confidence (very_low / low / medium / high / very_high).
5. **Their riskiest assumptions.** What, if false, kills the idea?

Then: initialize the workspace (see `workspace.md`), run the problem critique
on the stated problem, and propose the first hypotheses **from the riskiest
assumptions** — not from the most comfortable ones.

## 2. Problem statement critique

Task: decide whether the problem statement is written as a customer PROBLEM
or as a SOLUTION/feature/product idea. A good problem describes a **group**, a
**situation**, and a **consequence**, without naming the product.

Output (to the founder, and reflected in `project.md`):

- **Verdict**: reads as a problem / reads as a solution in disguise.
- **Reasoning**: point at the words that make it so.
- **Suggested rewrite** (when it reads as a solution): the same underlying
  belief recast as group + situation + consequence.

The canonical contrast:

- WEAK (a solution wearing a problem's clothes):
  *"Small businesses need an AI analytics dashboard."*
- BETTER (group, situation, consequence — no product):
  *"Small marketing teams struggle to understand why individual ad creatives
  perform differently, so they repeat poor decisions and waste budget."*

If the founder has a solution idea, don't delete it — park it in `project.md`
under "Solution idea (parked)" so it stops leaking into the problem statement.

## 3. Building hypotheses

Break the problem into single, testable claims. Each hypothesis is one of
these types:

| Type | Label | The claim being tested |
|---|---|---|
| `problem_exists` | Problem exists | A real group actually experiences this. |
| `problem_frequent` | Problem is frequent | It recurs often enough to matter. |
| `problem_urgent` | Problem is urgent | There are real consequences to leaving it unsolved. |
| `solutions_inadequate` | Existing solutions are inadequate | Current workarounds fall short. |
| `has_budget` | Customer has budget | They can and do spend money on this area. |
| `actively_searching` | Customer is actively searching | They are already looking for a fix. |
| `reachable` | Customer can be reached | You have a repeatable way to find them. |
| `buyer_user_identifiable` | Buyer & user are identifiable | You know who uses it and who pays. |
| `value_prop_compelling` | Value proposition is compelling | Your framing resonates against reality. |
| `will_commit` | Customer will commit | They give time, money, or reputation. |

Remember principle 7: frequency, urgency, and willingness to pay are
*separate* hypotheses. Don't fold them into one.

**The belief sentence** — every hypothesis's belief uses this template:

> We believe {segment} experiences {problem} when {context}, causing
> {consequence}. We will treat this as supported when we observe {evidence}
> across {N} relevant conversations.

**Testability review** — for each drafted belief, judge:

- **isTestable**: does it name a specific segment, a specific problem, a
  context, and a consequence, and state an observable bar?
- **issues**: vague segment ("people"), no context, no consequence, no
  observable bar, bundles several claims, mentions the solution.
- **rewrite**: a single testable version.
- **suggestedDisconfirming**: what observation would DISCONFIRM it.

**Disconfirming evidence is required before interviewing.** A hypothesis with
an empty "What would prove this wrong" section is not ready to test — say so
and help fill it, don't proceed around it.

## 4. Customer segments

Task: suggest and record candidate segments for the problem. Describe each by
**observable traits and shared circumstances**, not fictional persona details
(no invented names, ages, or personalities).

Each segment file records these dimensions (see `templates/segment.md`):

- industry; role; company size; geography
- workflow (how they operate today, where the problem would surface)
- trigger event (what makes the problem flare)
- existing alternative (what they use or do instead today)
- frequency (how often the problem recurs for them)
- severity (1–5, how badly it hurts when it does)
- budget ownership (do they control money; who approves)
- accessibility (1–5, how reachable they are for interviews)
- why they'd care / why they might not

**ICP comparison.** When the founder asks which segment to pursue, build a
side-by-side matrix over those dimensions plus current evidence strength per
segment, and reason about the trade-offs — severity and access usually beat
size. A well-liked-but-unproven segment must not outrank one with real
signal. Recommend; don't decide.
