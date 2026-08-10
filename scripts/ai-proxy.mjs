#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Groundwork local AI proxy (bring-your-own-key).
//
// A tiny, dependency-free Node HTTP server that sits between the app and your
// model provider so your API key NEVER ships in the browser bundle. The app
// POSTs { prompt, schema } here; this forwards it to OpenAI (or Anthropic) and
// returns a single JSON object, which the app then validates with zod.
//
// Run it:
//   1. Put your key in .env  ->  OPENAI_API_KEY=sk-...
//   2. npm run proxy            (loads .env automatically on Node >= 22.9)
//   3. In another terminal:  npm run dev
//      with .env also containing:
//        VITE_AI_PROVIDER=openai
//        VITE_AI_PROXY_URL=http://localhost:8787
//
// Config (env):
//   AI_PROVIDER   openai | anthropic     (default: openai)
//   AI_MODEL      model id               (default: gpt-4.1-mini / claude cheap)
//   OPENAI_API_KEY / ANTHROPIC_API_KEY   your key (only the chosen one needed)
//   PORT          listen port            (default: 8787)
//   ALLOW_ORIGIN  CORS origin            (default: * — fine for local dev)
// ---------------------------------------------------------------------------

import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase()
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*'
const DEFAULT_MODEL = PROVIDER === 'anthropic' ? 'claude-haiku-4-5' : 'gpt-4.1-mini'
const MODEL = process.env.AI_MODEL || DEFAULT_MODEL

const OPENAI_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// --- helpers ---------------------------------------------------------------
function send(res, code, body, extraHeaders = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': ALLOW_ORIGIN,
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    ...extraHeaders,
  })
  res.end(payload)
}

function readBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let data = ''
    let size = 0
    req.on('data', chunk => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Pull the first JSON object out of a model response, tolerating ```json fences.
function parseModelJSON(text) {
  if (!text) throw new Error('Empty model response')
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start !== -1 && end > start) return JSON.parse(candidate.slice(start, end + 1))
    throw new Error('Model did not return valid JSON')
  }
}

const JSON_SYSTEM =
  'You are a JSON API. Respond with exactly one valid JSON object that matches the ' +
  'schema described in the user message. No prose, no code fences, no explanation ' +
  'outside the JSON.'

// --- providers -------------------------------------------------------------
async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY is not set')
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: JSON_SYSTEM },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  })
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text().catch(() => '')}`)
  const j = await r.json()
  return parseModelJSON(j.choices?.[0]?.message?.content ?? '')
}

async function callAnthropic(prompt) {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY is not set')
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: JSON_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text().catch(() => '')}`)
  const j = await r.json()
  const text = Array.isArray(j.content) ? j.content.map(c => c.text || '').join('') : ''
  return parseModelJSON(text)
}

const callModel = PROVIDER === 'anthropic' ? callAnthropic : callOpenAI

// --- server ----------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '')
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, provider: PROVIDER, model: MODEL })
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' })

  try {
    const raw = await readBody(req)
    const { prompt, schema } = JSON.parse(raw || '{}')
    if (!prompt || typeof prompt !== 'string') return send(res, 400, { error: 'Missing "prompt"' })

    const started = Date.now()
    const result = await callModel(prompt)
    console.log(`[ai-proxy] ${schema || 'unknown'} -> ${MODEL} in ${Date.now() - started}ms`)
    return send(res, 200, result)
  } catch (e) {
    console.error('[ai-proxy] error:', e?.message || e)
    return send(res, 502, { error: String(e?.message || e) })
  }
})

// Fail fast with a clear message if the chosen provider has no key.
const activeKey = PROVIDER === 'anthropic' ? ANTHROPIC_KEY : OPENAI_KEY
if (!activeKey) {
  console.error(
    `\n[ai-proxy] No API key for provider "${PROVIDER}".\n` +
      `  Set ${PROVIDER === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} in your .env, then run: npm run proxy\n`,
  )
  process.exit(1)
}

server.listen(PORT, () => {
  console.log(`[ai-proxy] listening on http://localhost:${PORT}  (provider: ${PROVIDER}, model: ${MODEL})`)
  console.log('[ai-proxy] point the app at it:  VITE_AI_PROVIDER=openai  VITE_AI_PROXY_URL=http://localhost:' + PORT)
})
