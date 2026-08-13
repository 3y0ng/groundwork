// ---------------------------------------------------------------------------
// Onboarding: a one-time first-run walkthrough + an "enable real AI" setup
// guide. Kept deliberately light, one modal each, no multi-step coach-marks.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Modal, Callout } from './ui'
import { cn } from '@/lib/utils'
import { isMockAI, aiProviderLabel } from '@/ai/engine'
import { supabaseEnabled } from '@/lib/supabase'

const REPO = 'https://github.com/3y0ng/groundwork'

// --- First-run welcome -----------------------------------------------------
const STEPS = [
  { n: 1, title: 'Frame the problem', body: 'Describe who hurts and why, not the product you want to build.' },
  { n: 2, title: 'Break it into hypotheses', body: 'Turn the belief into testable claims, and decide what would prove each wrong.' },
  { n: 3, title: 'Interview and capture evidence', body: 'Ask about real past behaviour. What people did counts for more than what they say.' },
  { n: 4, title: 'Consolidate and decide', body: 'Weigh evidence by quality, then choose: continue, narrow, pivot, or proceed.' },
]

export function WelcomeModal({ onClose, onStartFresh, onOpenSetup }: { onClose: () => void; onStartFresh: () => void; onOpenSetup: () => void }) {
  return (
    <Modal open onClose={onClose} title="Welcome to Groundwork" sub="Turn a hunch into evidence you can trust. The path:">
      <div className="space-y-5">
        <ol className="space-y-3.5">
          {STEPS.map(s => (
            <li key={s.n} className="flex gap-3">
              <span className="w-5 h-5 shrink-0 rounded-full bg-brand-500 text-white text-xs grid place-items-center font-semibold mt-0.5">{s.n}</span>
              <div>
                <p className="font-medium text-sm text-ink">{s.title}</p>
                <p className="text-sm text-ink-soft leading-snug">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-line">
          <button className="btn-outline flex-1" onClick={onClose}>Explore the demo</button>
          <button className="btn-primary flex-1" onClick={onStartFresh}>Start my own project</button>
        </div>
        <p className="text-xs text-ink-faint text-center">
          Runs on a free demo AI.{' '}
          <button
            onClick={onOpenSetup}
            className="text-brand-600 hover:underline font-medium"
          >Add your own API key →</button>
        </p>
      </div>
    </Modal>
  )
}

// --- Enable-real-AI setup guide -------------------------------------------
const ENV_BLOCK = `# --- turn on real AI (bring your own key) ---
VITE_AI_PROVIDER=openai
VITE_AI_PROXY_URL=http://localhost:8787

# server-side only, never shipped to the browser
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=sk-your-key-here`

export function SetupGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} wide title="Enable real AI" sub="Your key stays on a local proxy and never enters the browser bundle.">
      <div className="space-y-4">
        {/* Live status */}
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('w-2 h-2 rounded-full', isMockAI ? 'bg-ink-faint/60' : 'bg-support-fg')} />
          <span className="text-ink-soft">
            Current AI: <strong className="text-ink">{aiProviderLabel}</strong>
            {isMockAI ? ', follow the steps below to switch to a real model.' : ', connected. You’re all set.'}
          </span>
        </div>

        <ol className="space-y-3">
          <Step n={1} title="Create your env file">
            From the project root, copy the example: <Code>cp .env.example .env</Code>
          </Step>
          <Step n={2} title="Add your OpenAI key">
            Get a key at <a className="text-brand-600 hover:underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a>, then set these values in <code className="text-xs bg-black/[0.05] px-1 rounded">.env</code>:
            <CopyBlock text={ENV_BLOCK} />
            <p className="text-xs text-ink-faint mt-1"><code>gpt-4.1-mini</code> is a cost-efficient default; change <code>AI_MODEL</code> to any chat model. Anthropic also works via <code>AI_PROVIDER=anthropic</code> + <code>ANTHROPIC_API_KEY</code>.</p>
          </Step>
          <Step n={3} title="Start the proxy">
            In one terminal: <Code>npm run proxy</Code> It listens on <code className="text-xs">http://localhost:8787</code> and holds your key.
          </Step>
          <Step n={4} title="Run the app">
            In another terminal: <Code>npm run dev</Code> Reload, the sidebar will show <strong>OpenAI</strong> instead of Mock engine.
          </Step>
        </ol>

        <Callout tone="good" title="Safe by default">
          Every live response is validated against the app’s schemas, and any failure automatically
          falls back to the mock engine, so the app never breaks, and you’re never billed for a broken call.
        </Callout>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-line p-3">
            <p className="font-semibold text-ink mb-0.5">Back up your work</p>
            <p className="text-ink-soft text-xs">No account needed, use <strong>Export / Import</strong> on the Project setup page to save a project to a file or move it between machines.</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-semibold text-ink mb-0.5">Persistent database (optional)</p>
            <p className="text-ink-soft text-xs">{supabaseEnabled ? 'Supabase is configured.' : 'Add Supabase for hosted auth + a shared database, see the repo README.'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-line">
          <a className="text-xs text-brand-600 hover:underline" href={`${REPO}/blob/main/SETUP.md`} target="_blank" rel="noreferrer">Full setup guide on GitHub →</a>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  )
}

// --- small helpers ---------------------------------------------------------
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-5 h-5 shrink-0 rounded-full bg-brand-50 text-brand-700 text-xs grid place-items-center font-semibold mt-0.5">{n}</span>
      <div className="text-sm text-ink-soft leading-relaxed">
        <span className="font-semibold text-ink">{title}. </span>
        {children}
      </div>
    </li>
  )
}

function Code({ children }: { children: string }) {
  return <code className="inline-block bg-ink text-white/90 text-xs font-mono px-1.5 py-0.5 rounded mx-0.5">{children}</code>
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative mt-2">
      <pre className="bg-ink text-white/90 text-xs font-mono rounded-lg p-3 overflow-x-auto whitespace-pre">{text}</pre>
      <button
        className="absolute top-2 right-2 text-[11px] bg-white/10 hover:bg-white/20 text-white rounded px-2 py-0.5"
        onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      >{copied ? 'Copied' : 'Copy'}</button>
    </div>
  )
}
