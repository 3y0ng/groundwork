# Evidence scoring

This is the quantitative core of Groundwork: the rule set that keeps interview
*count* from masquerading as evidence *strength*. Apply it exactly — the
arithmetic is deliberately simple so it can be shown and checked.

## Evidence kinds and weights

Every evidence item is classified as exactly one kind:

| Kind | Label | Weight | Tone | Meaning |
|---|---|---|---|---|
| `observed_past_behaviour` | Past behaviour | **5** | strong | Something they actually did. |
| `existing_commitment` | Existing commitment | **5** | strong | Money, time, or reputation already spent. |
| `new_commitment` | New commitment | **4** | strong | A concrete next step they agreed to. |
| `current_behaviour` | Current behaviour | **4** | medium | How they handle it today. |
| `stated_opinion` | Stated opinion | **2** | weak | What they say they think. |
| `hypothetical` | Hypothetical claim | **1** | weak | What they imagine they might do. |
| `compliment` | Compliment | **0** | weak | Encouragement, not evidence. |
| `contradiction` | Contradiction | **−3** | contra | Cuts against the hypothesis. |

Classification guardrails:

- A conditional future ("I would pilot it *if* you had something") is
  `hypothetical`, not `new_commitment`. A commitment is concrete: a scheduled
  call, an intro actually offered, a signed pilot.
- Paying for an adjacent tool today is `existing_commitment` — real spend in
  the problem area — but note in the interpretation that adjacent spend is not
  yet willingness to pay for *this* solution.
- "This is a great idea" is a `compliment`, weight 0, even when sincere.

Every item also has a **direction** relative to each hypothesis it is linked
to: `supports`, `contradicts`, or `unclear`.

## The scoring algorithm

For one hypothesis, take every evidence item linked to it (across all
interview files) and compute:

```
supportWeight = 0, contraWeight = 0, behaviourItems = 0
for each item:
  w = weight of its kind
  if direction == contradicts OR w < 0:
      contraWeight += (|w| if |w| > 0 else 3)
  else if direction == supports:
      supportWeight += w
  # direction == unclear with w >= 0 adds nothing
  if kind in {observed_past_behaviour, current_behaviour,
              existing_commitment, new_commitment}:
      behaviourItems += 1
```

Note: a zero-weight kind (compliment) that *contradicts* still adds 3 to
`contraWeight` — a compliment used to deflect ("great idea, but not for me")
is a polite no. `behaviourItems` counts behaviour/commitment kinds regardless
of direction.

Then the strength, first match wins:

| Strength | Condition |
|---|---|
| `none` | no evidence items |
| `contradicted` | contraWeight > supportWeight AND contraWeight ≥ 3 |
| `strong` | supportWeight ≥ 12 AND behaviourItems ≥ 3 |
| `mixed` | supportWeight ≥ 5 AND (behaviourItems ≥ 1 OR contraWeight > 0) |
| `weak` | supportWeight > 0 |
| `none` | otherwise |

Strength vocabulary (for display and ranking): `contradicted` (rank −1),
`none` (0), `weak` (1), `mixed` (2), `strong` (3). "Thinnest evidence" means
lowest by the order contradicted < none < weak < mixed < strong.

## Show your arithmetic — always

Whenever you score a hypothesis, write the working into its `## Evidence
score` section as a table so the founder (and a later session) can check it:

```markdown
| Evidence | Kind | Direction | Weight | Support | Contra |
|---|---|---|---|---|---|
| EV-1-1 | observed_past_behaviour | supports | 5 | 5 | 0 |
| EV-2-2 | contradiction | contradicts | −3 | 5 | 3 |
| ... |
| **Totals** | | | | **10** | **6** |

behaviourItems: 2 → strength: **mixed** (support 10 ≥ 5, contra > 0; not strong: 10 < 12)
```

State which rule fired and why the next rule up did *not*.

## Worked example

Four items linked to a hypothesis "the consequence is severe enough to act
on" (this is H3 in `examples/creative-memory/`, scored for real there):

| Evidence | Kind | Direction | Weight | Support | Contra |
|---|---|---|---|---|---|
| EV-1-2 "wasted about $6,000" | observed_past_behaviour | supports | 5 | 5 | 0 |
| EV-2-2 "could not tell you a time it cost us money" | contradiction | contradicts | −3 | 5 | 3 |
| EV-2-4 "not a top three problem for me" | contradiction | contradicts | −3 | 5 | 6 |
| EV-4-2 "CAC jumped 30% for three days" | observed_past_behaviour | supports | 5 | 10 | 6 |
| **Totals** | | | | **10** | **6** |

behaviourItems = 2 (the two `observed_past_behaviour` items).

- `contradicted`? contra 6 > support 10? No.
- `strong`? support 10 ≥ 12? No.
- `mixed`? support 10 ≥ 5 AND contraWeight > 0? **Yes → mixed.**

Two quantified consequences, two flat denials from the same segment: real but
unproven urgency. Ten more interviews of compliments would not change this
score — two more accounts of real cost would.

## Confidence vocabulary

Founder-stated confidence, kept separate from computed strength:

| Value | Label | ~Probability |
|---|---|---|
| `very_low` | Very low | 10% |
| `low` | Low | 30% |
| `medium` | Medium | 50% |
| `high` | High | 70% |
| `very_high` | Very high | 90% |

When computed strength and stated confidence diverge sharply, say so — that
gap is often the most useful thing to show a founder.
