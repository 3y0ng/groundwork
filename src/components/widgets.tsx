// ---------------------------------------------------------------------------
// Reusable domain widgets shared across pages: confidence indicators,
// evidence-strength meters, evidence-kind badges, question warnings.
// ---------------------------------------------------------------------------

import { Chip } from './ui'
import { cn } from '@/lib/utils'
import {
  EVIDENCE_STRENGTH, EVIDENCE_KIND, CONFIDENCE,
  type EvidenceStrength, type EvidenceKind, type Confidence, type EvidenceDirection,
  type HypothesisStatus,
} from '@/types/domain'

// Evidence strength is a five-stop scale, shown as segmented pips + label so
// it never relies on colour alone.
export function EvidenceStrengthMeter({ strength, showLabel = true }: { strength: EvidenceStrength; showLabel?: boolean }) {
  const meta = EVIDENCE_STRENGTH[strength]
  const filled = strength === 'contradicted' ? 0 : meta.rank
  const contradicted = strength === 'contradicted'
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-label={meta.label}>
        {[1, 2, 3].map(i => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-5 rounded-full',
              contradicted ? 'bg-contra-fg' : i <= filled ? 'bg-support-fg' : 'bg-black/[0.08]',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', contradicted ? 'text-contra-fg' : 'text-ink-soft')}>
          {meta.label}
        </span>
      )}
    </div>
  )
}

export function EvidenceKindBadge({ kind }: { kind: EvidenceKind }) {
  const meta = EVIDENCE_KIND[kind]
  const tone = meta.tone === 'strong' ? 'commit' : meta.tone === 'contra' ? 'contra' : meta.tone === 'medium' ? 'brand' : 'opinion'
  return (
    <Chip tone={tone as any} className="whitespace-nowrap">
      {meta.tone === 'strong' ? '●' : meta.tone === 'contra' ? '▲' : '○'} {meta.label}
    </Chip>
  )
}

export function DirectionBadge({ direction }: { direction: EvidenceDirection }) {
  if (direction === 'supports') return <Chip tone="support">↑ Supports</Chip>
  if (direction === 'contradicts') return <Chip tone="contra">↓ Contradicts</Chip>
  return <Chip tone="unclear">~ Unclear</Chip>
}

export function ConfidenceIndicator({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE[confidence]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[10, 30, 50, 70, 90].map(stop => (
          <span key={stop} className={cn('h-3 w-1.5 rounded-sm', meta.pct >= stop ? 'bg-brand-500' : 'bg-black/[0.08]')} />
        ))}
      </div>
      <span className="text-xs font-medium text-ink-soft">{meta.label} confidence</span>
    </div>
  )
}

const STATUS_META: Record<HypothesisStatus, { label: string; tone: 'neutral' | 'support' | 'contra' | 'unclear' | 'brand' }> = {
  untested: { label: 'Untested', tone: 'neutral' },
  testing: { label: 'Testing', tone: 'brand' },
  supported: { label: 'Supported', tone: 'support' },
  partially_supported: { label: 'Partially supported', tone: 'unclear' },
  inconclusive: { label: 'Inconclusive', tone: 'neutral' },
  contradicted: { label: 'Contradicted', tone: 'contra' },
}

export function StatusBadge({ status }: { status: HypothesisStatus }) {
  const m = STATUS_META[status]
  return <Chip tone={m.tone}>{m.label}</Chip>
}

// Question quality warning, reused by planner + notes.
export function QuestionWarning({
  problem, reason, replacement,
}: { problem: string; reason: string; replacement: string }) {
  return (
    <div className="rounded-lg border border-unclear-line bg-unclear-bg px-3 py-2.5 text-sm">
      <p className="font-semibold text-unclear-fg flex items-center gap-1.5">
        <span aria-hidden>⚠</span> Weak question, {problem}
      </p>
      <p className="text-ink-soft mt-1">{reason}</p>
      <p className="mt-2 text-ink">
        <span className="text-xs font-semibold uppercase tracking-wide text-support-fg">Try instead</span>
        <br />
        <span className="italic">"{replacement}"</span>
      </p>
    </div>
  )
}
