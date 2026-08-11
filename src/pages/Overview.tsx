import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Card, SectionHeading, Chip, Meter, Callout } from '@/components/ui'
import { EvidenceStrengthMeter, StatusBadge } from '@/components/widgets'
import { useActiveProject, useProjectData } from '@/store/hooks'
import { scoreEvidence, evidenceForHypothesis } from '@/store/useStore'
import { daysUntil, formatDate, groupBy } from '@/lib/utils'

export function Overview() {
  const project = useActiveProject()
  const { hypotheses, segments, interviews, evidence } = useProjectData()

  const stats = useMemo(() => {
    const scored = hypotheses.map(h => scoreEvidence(evidenceForHypothesis(h.id, evidence)))
    const supported = hypotheses.filter(h => h.status === 'supported' || h.status === 'partially_supported').length
    const contradicted = hypotheses.filter(h => h.status === 'contradicted').length
    const strong = scored.filter(s => s.strength === 'strong').length
    return { supported, contradicted, strong, active: hypotheses.filter(h => h.status === 'testing').length }
  }, [hypotheses, evidence])

  const bySegment = groupBy(interviews.filter(i => i.segmentId), i => i.segmentId as string)

  // Aggregate "most common" signals from structured interview fields.
  const pains = topTerms(interviews.map(i => i.painPoints))
  const triggers = topTerms(interviews.map(i => i.triggerEvents))
  const alts = topTerms(interviews.map(i => i.existingTools))

  const daysLeft = daysUntil(project?.deadline)

  const nextAction = useMemo(
    () => computeNextAction(hypotheses, segments, interviews, evidence),
    [hypotheses, segments, interviews, evidence],
  )

  if (!project) return null

  return (
    <div>
      <SectionHeading
        title={project.name || 'Untitled project'}
        sub={project.problemStatement || 'Add a one-sentence problem statement in Project setup to frame what you are testing.'}
        action={
          <Link to="/settings" className="btn-outline">Project setup</Link>
        }
      />

      {/* The dashboard should answer real questions, not show vanity metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Active hypotheses" value={stats.active} sub={`${hypotheses.length} total`} />
        <Stat label="Supported" value={stats.supported} tone="support" sub="incl. partial" />
        <Stat label="Contradicted" value={stats.contradicted} tone="contra" sub="kept, not hidden" />
        <Stat label="Interviews" value={interviews.length} sub={`${segments.length} segments`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: what have we learned */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Hypotheses & evidence strength</h2>
              <Link to="/hypotheses" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            {hypotheses.length === 0 ? (
              <div className="text-sm text-ink-soft py-4 text-center">
                No hypotheses yet. <Link to="/hypotheses" className="text-brand-600 hover:underline">Create your first one</Link> to start turning your belief into something testable.
              </div>
            ) : (
              <div className="space-y-2.5">
                {hypotheses.map(h => {
                  const s = scoreEvidence(evidenceForHypothesis(h.id, evidence))
                  const linked = interviews.filter(i => i.hypothesisIds.includes(h.id)).length
                  return (
                    <Link key={h.id} to={`/hypotheses/${h.id}`} className="block rounded-lg border border-line p-3 hover:bg-black/[0.02] transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-sm text-ink truncate">{h.title}</span>
                        <StatusBadge status={h.status} />
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-2">
                        <EvidenceStrengthMeter strength={s.strength === 'none' ? h.strength : s.strength} />
                        <span className="text-xs text-ink-faint whitespace-nowrap">{linked} interview{linked === 1 ? '' : 's'}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold mb-1">Recommended next action</h2>
            <p className="text-sm text-ink-soft mb-3">Based on where your validation is thinnest, not on interview count.</p>
            <Link to={nextAction.to} className="block">
              <Callout tone="info" title={nextAction.title}>
                {nextAction.body}
                <span className="block mt-1.5 font-medium text-brand-700">{nextAction.cta} →</span>
              </Callout>
            </Link>
          </Card>
        </div>

        {/* Right: reliability + who to talk to */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="section-title mb-3">Interviews by segment</h3>
            {segments.map(seg => {
              const n = bySegment[seg.id]?.length ?? 0
              return (
                <div key={seg.id} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-soft truncate pr-2">{seg.name}</span>
                    <span className="text-ink-faint">{n}</span>
                  </div>
                  <Meter value={n} max={Math.max(3, interviews.length)} />
                </div>
              )
            })}
          </Card>

          {project.deadline && (
            <Card className="p-5">
              <h3 className="section-title mb-2">Validation deadline</h3>
              <p className="text-2xl font-semibold text-ink">{daysLeft}<span className="text-sm text-ink-faint font-normal"> days left</span></p>
              <p className="text-xs text-ink-faint mt-1">{formatDate(project.deadline)}</p>
              <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line">
                <span className="font-medium">Decision to make:</span> {project.decisionToMake}
              </p>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="section-title mb-3">Recurring signals</h3>
            <SignalList title="Pain points" items={pains} />
            <SignalList title="Triggers" items={triggers} />
            <SignalList title="Existing alternatives" items={alts} />
          </Card>
        </div>
      </div>
    </div>
  )
}

// Recommends the single most useful next step for wherever the founder is in the
// journey, so a brand-new project points at "create a hypothesis", not at
// consolidation it has no data for.
function computeNextAction(
  hypotheses: ReturnType<typeof useProjectData>['hypotheses'],
  segments: ReturnType<typeof useProjectData>['segments'],
  interviews: ReturnType<typeof useProjectData>['interviews'],
  evidence: ReturnType<typeof useProjectData>['evidence'],
): { title: string; body: string; to: string; cta: string } {
  if (hypotheses.length === 0)
    return { title: 'Define your first hypothesis', body: 'Break your problem into a specific, testable claim, and decide up front what would prove it wrong.', to: '/hypotheses', cta: 'Go to Hypotheses' }
  if (segments.length === 0)
    return { title: 'Add a customer segment', body: 'Describe the group you think has this problem by observable traits, so you know who to interview.', to: '/segments', cta: 'Go to Customer Segments' }
  if (interviews.length === 0)
    return { title: 'Plan and log your first interview', body: 'Generate a guide that digs into real past behaviour, then capture what you heard.', to: '/interviews', cta: 'Go to Interviews' }
  if (evidence.length === 0)
    return { title: 'Extract evidence from your interviews', body: 'Turn your notes into classified, quote-backed evidence and tie it to your hypotheses.', to: '/interviews', cta: 'Go to Interviews' }

  // There is data, point at the hypothesis with the thinnest evidence.
  const ranked = hypotheses
    .map(h => ({ h, score: scoreEvidence(evidenceForHypothesis(h.id, evidence)) }))
    .sort((a, b) => rankStrength(a.score.strength) - rankStrength(b.score.strength))
  const weakest = ranked[0]
  return {
    title: `Strengthen "${weakest.h.title}"`,
    body: 'This hypothesis has the thinnest evidence. Consolidate what you have, then run interviews aimed squarely at the gap.',
    to: `/hypotheses/${weakest.h.id}`,
    cta: 'Open hypothesis',
  }
}

function rankStrength(s: string): number {
  return { contradicted: 0, none: 1, weak: 2, mixed: 3, strong: 4 }[s] ?? 1
}

function Stat({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: 'support' | 'contra' }) {
  const color = tone === 'support' ? 'text-support-fg' : tone === 'contra' ? 'text-contra-fg' : 'text-ink'
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-ink-faint mt-0.5">{sub}</p>}
    </Card>
  )
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-medium text-ink-faint mb-1">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map(t => <Chip key={t}>{t}</Chip>)}
      </div>
    </div>
  )
}

// Naive keyword frequency over free-text fields, for the recurring-signal view.
function topTerms(texts: string[], limit = 4): string[] {
  const KEYWORDS = ['spreadsheet', 'notion', 'airtable', 'motion', 'cac', 'fatigue', 'repeat', 'onboard', 'memory', 'stale', 'budget', 'report', 'screenshot', 'brief', 'workaround']
  const counts: Record<string, number> = {}
  const blob = texts.join(' ').toLowerCase()
  KEYWORDS.forEach(k => {
    const n = blob.split(k).length - 1
    if (n > 0) counts[k] = n
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([k]) => k)
}
