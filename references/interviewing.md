# Interviewing: guide generation and question checking

Goal: conversations that uncover **real past behaviour**, not opinions about
an imagined future. Never include hypothetical ("would you…"), leading, or
pitch questions in anything you generate.

## Interview guide generation

Inputs (ask for any that are missing):

- **Hypothesis under test** (one primary; others may be listed as secondary)
- **Segment** being interviewed
- **Objective** — what this conversation must establish
- **Already known** — so questions don't re-cover it
- **Still uncertain** — where the questions should dig

Generate a conversational guide covering these nine sections **in order**
(write it to `groundwork/guides/` using `templates/guide.md`):

| # | Section | Label | What it uncovers | Example strong questions |
|---|---|---|---|---|
| 1 | `context` | Context | Who they are, how the area fits their life/work | "Walk me through your role and where {area} fits in it." · "Who else is involved when this comes up?" |
| 2 | `recent_occurrence` | Most recent occurrence | A specific, real instance | "Tell me about the last time this happened." · "When was that? What was going on?" |
| 3 | `current_workflow` | Current workflow | What they actually do today | "Walk me through exactly what you did, step by step." · "What do you use to keep track today?" |
| 4 | `severity_consequences` | Severity & consequences | What it really costs | "What did that cost you in time or money?" · "What happened because of it?" |
| 5 | `existing_alternatives` | Existing alternatives | Today's tools and workarounds | "What are you using for this now?" · "How did you end up with that setup?" |
| 6 | `previous_attempts` | Previous attempts | Whether they tried to fix it | "What have you already tried to fix it?" · "Why did that not stick?" |
| 7 | `spending_resources` | Spending & resources | Real money/time in the area | "What do you currently pay for in this area?" · "Who signed off on that?" |
| 8 | `decision_making` | Decision-making | How change actually happens | "Last time you adopted a new tool, how did that decision get made?" |
| 9 | `commitment` | Commitment / next step | A concrete next step, not applause | "Could you show me the spreadsheet you mentioned?" · "Who else should I talk to about this?" |

Each question gets an optional one-line rationale (what evidence it is
fishing for). Keep the guide conversational — an ordered prompt list, not a
survey script.

## Question quality checker

Task: judge whether one interview question will produce reliable evidence.

**Weak patterns** (any match → verdict `weak`):

| Pattern | Problem |
|---|---|
| "would you use / pay / want / buy…" | Hypothetical, asks about an imagined future action. |
| "do you think…" | Invites an opinion rather than a fact. |
| "don't you find / think / hate / agree…" | Leading, signals the answer you want. |
| "is this a good/great idea?" | Asks for a compliment, not evidence. |
| "how much would you pay…" | Hypothetical pricing, unreliable without a real transaction. |
| "would an AI…" (or any pitch of your solution) | Pitches a solution and asks for a hypothetical. |
| "do you like the/this idea/product/app…" | Fishing for approval of your idea. |
| "would it help…" | Hypothetical; people over-predict that things will help. |

Strong questions ask about **specific past events and current behaviour**.

Output for a weak question: verdict `weak` + the problem + why it weakens the
evidence + a **replacement**. Draw replacements from (or model them on):

- "Tell me about the last time this happened."
- "Walk me through exactly what you did."
- "What triggered you to deal with it?"
- "How often does that happen?"
- "What did that cost you in time or money?"
- "What have you already tried to fix it?"

Output for a strong question: verdict `strong` + one line on what evidence it
should produce.

Apply this checker to every question you generate, too — a guide you wrote is
not exempt.
