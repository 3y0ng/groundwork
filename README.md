# Groundwork

**An evidence-based customer-discovery workspace for early-stage founders.**

Groundwork helps a founder move from

> "I think this is a problem."

to

> "I have credible evidence that a specific group experiences this problem
> frequently, urgently, and strongly enough to change their behaviour or pay
> for a solution."

It does that by making the *quality* of evidence visible, and by refusing to
let vague validation, compliments, hypotheticals, and leading questions
masquerade as proof.

---

## The methodology (why the product is shaped this way)

Groundwork translates a handful of well-established discovery principles into
workflow and feedback. No book text is reproduced; these are the underlying
ideas, expressed in the product's own guidance:

1. **Ask about the past, not the future.** What someone *did* is evidence.
   What they *say they would do* is a prediction, and people are bad at it. The
   interview planner leads with "tell me about the last time…"; the question
   checker flags "would you use…" as weak.

2. **Behaviour > opinion; commitment > enthusiasm.** Every extracted piece of
   evidence is classified by kind (past behaviour, current behaviour, existing
   commitment, new commitment, opinion, hypothetical, compliment,
   contradiction) and **weighted** accordingly. Compliments are worth zero.
   Contradictions subtract. See `EVIDENCE_KIND` in `src/types/domain.ts`.

3. **Separate the problem from your solution.** Project setup checks whether
   your problem statement is secretly a product pitch and asks you to rewrite it
   as a customer problem with a consequence.

4. **Decide what would prove you wrong — first.** Each hypothesis requires
   *disconfirming evidence* before you interview, which is the main defence
   against confirmation bias.

5. **Evidence strength is not interview count.** A hypothesis backed by five
   compliments is *weaker* than one backed by two accounts of real spend. The
   consolidation engine weighs quality and never concludes by majority vote.

6. **Keep the original separate from the interpretation.** Evidence cards store
   the verbatim quote apart from both the founder's read and the AI's read. The
   AI never invents a quote that wasn't in the notes.

7. **Frequency ≠ urgency ≠ willingness to pay.** These are distinct
   hypotheses. The demo deliberately shows a problem that is clearly *frequent*
   but whose *urgency* is unproven — so the dashboard's recommended action is to
   go test consequence, not to celebrate.

---

## Core workflow

Overview → **Hypotheses** → **Customer Segments** → **Interviews** →
**Insights** → **Evidence Board** → **Decisions**.

1. Create a project and state the problem (not the solution).
2. Break the belief into testable hypotheses with a sentence builder.
3. Identify and prioritise customer segments (ICP matrix, side-by-side compare).
4. Generate a targeted interview guide; check individual questions for weakness.
5. Log conversation notes with structured capture.
6. Extract classified, quote-backed evidence and tie it to hypotheses.
7. Get per-dimension interview-quality feedback, talk ratio, and missed
   follow-ups.
8. Consolidate evidence across interviews into a reasoned conclusion.
9. Record a decision — continue, narrow, refine, proceed, pause, reject, pivot —
   with the evidence behind it and what would change your mind.

---

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** (calm, analytical design system in `tailwind.config.js`)
- **Zustand** store persisted to `localStorage` (`src/store/`)
- **Zod-validated** structured AI responses (`src/ai/schemas.ts`)
- **Supabase** seam for auth + Postgres (`src/lib/supabase.ts`, `supabase/`)

The app runs **fully offline** out of the box: a heuristic mock AI engine reads
your actual note text (no key, no network), and an in-browser store holds the
data. Supabase and a live LLM are optional upgrades.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

That's it — the demo project "Creative Memory" loads with mixed sample
interviews. `npm run build` produces a production bundle; `npm run lint`
type-checks.

### Optional: connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (tables, enums, RLS).
3. Set an owner and run `supabase/seed.sql` for server-side demo data.
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.

The sidebar footer shows whether the database is `Local (browser)` or
`Supabase`.

### Optional: connect a live LLM

The mock engine emulates a real model's outputs. To go live:

1. Stand up a small server-side proxy that accepts `{ prompt }`, calls your
   model (e.g. Claude), and returns JSON conforming to the schemas in
   `src/ai/schemas.ts`. Do **not** put a model key in the client bundle.
2. Implement `callLLM()` in `src/ai/engine.ts` to POST to that proxy.
3. Set `VITE_AI_PROVIDER=anthropic` and `VITE_AI_PROXY_URL=...`.

Because every AI call already goes through the `ai` facade and validates its
response with zod, swapping the engine changes nothing else in the app.

---

## Project structure

```
src/
  types/domain.ts        # 11-entity data model + shared vocabularies
  ai/
    prompts.ts           # prompt templates (system rules + per-task prompts)
    schemas.ts           # zod schemas for every structured AI response
    engine.ts            # ai facade: heuristic mock + live-provider seam
  store/
    seed.ts              # realistic mixed demo data
    useStore.ts          # zustand store + quality-weighted evidence scoring
    hooks.ts             # active-project selectors
  components/            # ui primitives + reusable domain widgets
  pages/                 # Overview, Hypotheses, Segments, Interviews, ...
supabase/
  schema.sql             # Postgres schema + RLS
  seed.sql               # server-side demo seed
```

## Data model

Entities: **Project, Hypothesis, CustomerSegment, Interview,
InterviewTemplate/Question, EvidenceItem, Decision, Insight** (+ Profile/User).
Key relationships: a project has many hypotheses and segments; a hypothesis
relates to many segments; an interview belongs to a segment and can test many
hypotheses; an evidence item belongs to an interview and can support or
contradict many hypotheses; a decision belongs to a hypothesis; insights attach
at interview, segment, hypothesis, or project level. Full definitions live in
`src/types/domain.ts` and mirror `supabase/schema.sql`.

## What Groundwork deliberately does *not* do (v1)

No CRM, outreach automation, scheduling, call recording, billing, or team
permissions. The point of the first version is the validation reasoning, not
logistics.

---

## AI safety rules (enforced in prompts and honoured by the mock)

- Never fabricate a customer quote — quotes are verbatim from the notes.
- Never present weak evidence as fact; preserve uncertainty.
- Never treat compliments as validation or interview count as evidence quality.
- Always explain reasoning and point back to the source text.
- Always keep the founder's interpretation separate and easy to correct.
