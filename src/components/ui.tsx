// ---------------------------------------------------------------------------
// Small shared UI primitives. Deliberately plain, the product should feel
// calm and analytical, not decorative.
// ---------------------------------------------------------------------------

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>
}

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {sub && <p className="text-sm text-ink-soft mt-0.5 max-w-2xl">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink-faint mt-1">{hint}</p>}
    </div>
  )
}

export function EmptyState({
  title, body, action, icon,
}: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-10 text-center flex flex-col items-center">
      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
        {icon ?? <DotIcon />}
      </div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink-soft mt-1 max-w-md">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Chip({
  tone = 'neutral', children, className,
}: {
  tone?: 'neutral' | 'support' | 'contra' | 'unclear' | 'commit' | 'opinion' | 'brand'
  children: ReactNode
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-black/[0.03] text-ink-soft border-line',
    support: 'bg-support-bg text-support-fg border-support-line',
    contra: 'bg-contra-bg text-contra-fg border-contra-line',
    unclear: 'bg-unclear-bg text-unclear-fg border-unclear-line',
    commit: 'bg-commit-bg text-commit-fg border-commit-line',
    opinion: 'bg-opinion-bg text-opinion-fg border-opinion-line',
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
  }
  return <span className={cn('chip', tones[tone], className)}>{children}</span>
}

// Modal ---------------------------------------------------------------------
export function Modal({
  open, onClose, title, sub, children, wide,
}: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cn('relative card shadow-pop w-full my-4', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line">
          <div>
            <h2 className="font-semibold text-ink">{title}</h2>
            {sub && <p className="text-sm text-ink-soft mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-2 px-2 py-1 text-ink-faint" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// A callout used for warnings and AI notes.
export function Callout({
  tone = 'warn', title, children,
}: { tone?: 'warn' | 'info' | 'good'; title?: string; children: ReactNode }) {
  const styles = {
    warn: 'bg-unclear-bg border-unclear-line text-unclear-fg',
    info: 'bg-brand-50 border-brand-100 text-brand-700',
    good: 'bg-support-bg border-support-line text-support-fg',
  }[tone]
  return (
    <div className={cn('rounded-lg border px-3.5 py-3 text-sm', styles)}>
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

function DotIcon() {
  return <span className="text-xl leading-none">◔</span>
}

// A labelled meter used for confidence + evidence.
export function Meter({ value, max = 100, tone = 'brand' }: { value: number; max?: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = tone === 'support' ? 'bg-support-fg' : tone === 'contra' ? 'bg-contra-fg' : tone === 'unclear' ? 'bg-unclear-fg' : 'bg-brand-500'
  return (
    <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}
