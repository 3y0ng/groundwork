# Groundwork — TODO

Status of the build and everything still outstanding.
Last updated: 2026-08-07

---

## Accounts & external services — NONE are set up yet

The app runs fully offline on purpose. Nothing below is connected:

- [ ] **Supabase account / project** — not created. No `VITE_SUPABASE_URL` or
      `VITE_SUPABASE_ANON_KEY`. App currently uses an in-browser `localStorage`
      store (`src/store/useStore.ts`). Schema + seed SQL are written and ready
      (`supabase/schema.sql`, `supabase/seed.sql`) but have never been run.
- [ ] **AI provider (Anthropic or other)** — not connected. `VITE_AI_PROVIDER`
      defaults to `mock`. The mock engine is heuristic (regex/keyword), NOT a
      real LLM. `callLLM()` in `src/ai/engine.ts` is an intentional stub that
      throws.
- [ ] **AI proxy server** — does not exist. Needed so a model key never ships
      in the client bundle. No `VITE_AI_PROXY_URL`.
- [ ] **Hosting / deployment** — nothing deployed. No Vercel/Netlify/etc.
- [ ] **Git remote** — local repo only. No GitHub remote, not pushed anywhere.
- [ ] **`.env` file** — not created. Only `.env.example` exists.
- [ ] **Custom domain, analytics, error monitoring** — none.

---

## What IS done and working

- [x] Full app: React + TS + Tailwind + Zustand, builds clean, verified in browser
- [x] All 7 sidebar sections + project setup + hypothesis/interview detail pages
- [x] 11-entity data model (`src/types/domain.ts`)
- [x] Quality-weighted evidence scoring (behaviour/commitment > opinion/compliment)
- [x] Mock AI: problem critique, hypothesis rewrite, guide generation, weak-question
      detection, evidence extraction, interview feedback, consolidation, decisions
- [x] Zod schemas for every AI response
- [x] Supabase schema.sql + seed.sql written (RLS included) — ready to run
- [x] Realistic mixed demo data (strong / low-urgency / contradiction)
- [x] README with methodology + setup

---

## To connect Supabase (auth + persistent DB)

- [ ] Create a Supabase project; grab URL + anon key
- [ ] Run `supabase/schema.sql` in the SQL editor
- [ ] Create/sign in a user, then run `supabase/seed.sql` with that owner id
- [ ] Add `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] **Write the data layer** — the store is currently local-only. Add a
      Supabase-backed repository behind the same store interface, or swap
      `useStore` actions to async queries. (This code does not exist yet.)
- [ ] Build auth UI (sign up / log in / sign out) — there is no auth screen yet
- [ ] Gate the app behind a session; scope `activeProject` to the logged-in user

## To connect a real LLM

- [ ] Stand up a small proxy (serverless fn or tiny server) that takes
      `{ prompt }`, calls the model, returns JSON matching `src/ai/schemas.ts`
- [ ] Implement `callLLM()` in `src/ai/engine.ts` to POST to the proxy
- [ ] Set `VITE_AI_PROVIDER=anthropic` + `VITE_AI_PROXY_URL`
- [ ] Handle failure/timeout/retry + schema-validation errors in the UI
- [ ] Add rate limiting + a per-user usage cap on the proxy

## Product gaps (features described but not built in v1)

- [ ] **Inline highlight-to-tag** in the notes editor — spec asked for selecting
      a passage and assigning tags/hypotheses. Currently tagging happens via the
      AI extraction step + structured fields, not manual highlight.
- [ ] **Save/edit/reorder interview templates UI** — templates can be saved from
      the planner but there is no screen to manage or re-open them.
- [ ] **Manual "add evidence" form** — evidence is created only via AI extraction;
      no button to add a piece of evidence by hand.
- [ ] **Assumptions editor** on hypotheses (field exists in the model, no UI)
- [ ] **Edit/delete** affordances are thin on some cards (segments, hypotheses)
- [ ] **Cross-project evidence board** — board is currently scoped to the active
      project; spec mentioned cross-project filtering
- [ ] **Export** (PDF/CSV of evidence, decisions, a validation report)

## Quality / hardening

- [ ] Tests — none yet (unit tests for `scoreEvidence`, consolidation logic;
      component tests for the key flows)
- [ ] Accessibility pass (focus traps in modals, keyboard nav, aria labels)
- [ ] Mobile layout (currently tuned for desktop/tablet per the brief)
- [ ] Code-split the bundle (currently ~560kB; Vite warns >500kB)
- [ ] Empty-state polish for a brand-new project with zero data
- [ ] Error boundaries + a 404 route

## Housekeeping

- [ ] Decide whether to push to a GitHub remote (not done — no unsolicited PRs)
- [ ] Add a LICENSE if this will be shared
- [ ] Remove the `groundwork` entry added to `~/.claude/launch.json` if not wanted
