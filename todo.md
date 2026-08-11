# Groundwork, TODO

Current status and what is still outstanding.
Last updated: 2026-08-11

Repo: https://github.com/3y0ng/groundwork (public, MIT)
Everything below is committed and pushed to `main`.

---

## Done

**App and workflow**
- [x] Full app: React + TS + Vite + Tailwind + Zustand, builds clean.
- [x] All 7 sections (Overview, Hypotheses, Segments, Interviews, Insights,
      Evidence Board, Decisions) + project setup + hypothesis/interview detail.
- [x] 11-entity data model; quality-weighted evidence scoring
      (behaviour/commitment outrank opinion/compliment).
- [x] Mock AI engine: problem critique, hypothesis rewrite, guide generation,
      weak-question detection, evidence extraction, interview feedback,
      consolidation, decision support. Zod schemas for every response.
- [x] Realistic mixed demo data (strong / low-urgency / contradiction).

**Real AI (bring your own key)**
- [x] `callLLM()` proxy seam in `src/ai/engine.ts` (provider `openai` or
      `anthropic`); every live call validated by zod, graceful fallback to mock.
- [x] Bundled zero-dep local proxy `scripts/ai-proxy.mjs` + `npm run proxy`.

**Onboarding and new-user flow**
- [x] First-run welcome walkthrough (decluttered) + "Start my own project" vs
      "Explore the demo"; `startFresh()` blank workspace.
- [x] In-app "Enable real AI" setup guide (env steps + copyable block).
- [x] Dynamic Overview "recommended next action"; clean zero-data dashboard.
- [x] Data export / import (per-project JSON) with full id-remap.

**Quality and housekeeping**
- [x] Top-level error boundary (friendly recovery screen).
- [x] vitest suite (16 tests) for scoring + mock-AI logic. `npm test`.
- [x] `.env.example`, README (three tiers), SETUP.md, MIT LICENSE.
- [x] Pyreel maker attribution (sidebar, package.json, README).
- [x] Published to GitHub (public).
- [x] Em dashes removed project-wide.

---

## Outstanding

**Needs your input / key (I cannot do these)**
- [ ] One real-key AI smoke test: run a live extraction/feedback with your
      OpenAI key to confirm the model returns schema-valid JSON. Mock fallback
      exists either way.
- [ ] Decide the tab-title punctuation ("Groundwork, ..." vs "Groundwork: ...").

**Product features (spec items not built in v1)**
- [ ] Inline highlight-to-tag in the notes editor (select a passage, assign
      tags/hypotheses). Today tagging is via AI extraction + structured fields.
- [ ] Manual "add evidence" form (evidence is currently AI-extraction only).
- [ ] Interview-template management UI (templates can be saved, not re-opened).
- [ ] Assumptions editor on hypotheses (field exists in the model, no UI).
- [ ] Cross-project evidence board (board is scoped to the active project).
- [ ] Export a validation report (PDF/CSV of evidence + decisions).

**Hardening / polish**
- [ ] Accessibility pass (modal focus traps, keyboard nav, aria labels).
- [ ] Mobile layout (currently tuned for desktop/tablet).
- [ ] Code-split the bundle (~560 kB; Vite warns >500 kB).
- [ ] A 404 route.
- [ ] README screenshots / GIF for the public repo (needs image assets).

**Optional: persistent database (Supabase)**
- [ ] Create a Supabase project; run `supabase/schema.sql`, then `seed.sql`.
- [ ] Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env`.
- [ ] Build the Supabase-backed data layer (store is local-only today) + auth UI.

**Separate track: Option A (hosted free tool on your key)**
- [ ] Not built (you chose Option B). The proxy seam, export/import, and the
      guardrail plan are the foundation. Would add: a guarded serverless proxy
      (rate limit + bot check + spend cap) and a Vercel deploy.

---

## Environment note
- A `groundwork` entry was added to `~/.claude/launch.json` so the local
  preview server can run. Remove it if not wanted.
