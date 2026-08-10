# Setup guide

Groundwork runs in three tiers. Start at tier 1 — it needs nothing — and add the
others only when you want them. There is also an in-app version of this guide:
click **AI** (or **Setup & help**) at the bottom of the sidebar.

---

## Tier 1 — Just run it (no config, keyless mock AI)

```bash
git clone https://github.com/3y0ng/groundwork.git
cd groundwork
npm install
npm run dev            # http://localhost:5173
```

The demo project "Creative Memory" loads with mixed sample interviews. The AI is
a **heuristic mock** that reads your note text — no key, no network. This is
enough to explore the whole workflow.

Your work is saved in the browser. On the **Project setup** page, use **Export**
to download a project as JSON and **Import** to restore it (handy since there are
no accounts).

Useful scripts:

| Command | Does |
|---|---|
| `npm run dev` | Start the app (mock AI) |
| `npm run build` | Production build |
| `npm run lint` | Type-check |
| `npm run proxy` | Start the local AI proxy (tier 2) |

---

## Tier 2 — Real AI (bring your own key)

The app never holds your model key. Instead it talks to a tiny local proxy
(`scripts/ai-proxy.mjs`) that keeps the key server-side.

### 1. Create your env file

```bash
cp .env.example .env
```

### 2. Add your key and switch the provider

Get an OpenAI key at <https://platform.openai.com/api-keys>, then set these in
`.env`:

```bash
# client-side (safe to expose)
VITE_AI_PROVIDER=openai
VITE_AI_PROXY_URL=http://localhost:8787

# server-side only — never shipped to the browser
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=sk-your-key-here
```

`gpt-4.1-mini` is a cost-efficient default; set `AI_MODEL` to any chat model.
Prefer Anthropic? Use `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` instead
(defaults to `claude-haiku-4-5`).

### 3. Run the proxy and the app (two terminals)

```bash
npm run proxy         # terminal 1  → http://localhost:8787
npm run dev           # terminal 2
```

Reload the app — the sidebar AI status will read **OpenAI**. Health check:
`curl http://localhost:8787/health`.

### How it behaves

- Every live response is validated against the app's zod schemas
  (`src/ai/schemas.ts`). If a call fails or returns malformed JSON, the app
  automatically **falls back to the mock** — it never dead-ends.
- The proxy prints one line per request so you can watch usage.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Sidebar still says "Mock engine" | `.env` must set `VITE_AI_PROVIDER=openai`; restart `npm run dev` (Vite only reads env at start). |
| `OPENAI_API_KEY is not set` | The proxy loads `.env` on start (`npm run proxy`). Confirm the key is in `.env`, or export it in the shell. |
| `401` in the proxy logs | The key is wrong or lacks credit. |
| Requests hang | Confirm the proxy is running and `VITE_AI_PROXY_URL` matches its port (default `8787`). |

> Deploying this **publicly** on your own key? Don't expose the proxy
> unprotected. Add rate limiting, a bot check (e.g. Cloudflare Turnstile), a CORS
> allowlist, and a hard monthly spend cap first. The bundled proxy is meant for
> personal / development use.

---

## Tier 3 — Persistent database (optional, Supabase)

By default data lives in the browser. To add hosted auth and a shared Postgres
database:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (tables,
   enums, row-level security).
3. Set an owner id and run [`supabase/seed.sql`](supabase/seed.sql) for
   server-side demo data.
4. In `.env`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The sidebar footer shows whether the database is `Local (browser)` or
`Supabase`.

---

Made by [Pyreel](https://pyreel.com).
