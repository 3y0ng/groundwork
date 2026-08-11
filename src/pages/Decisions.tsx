import { Link } from 'react-router-dom'
import { Card, SectionHeading, EmptyState, Chip, Callout } from '@/components/ui'
import { useProjectData } from '@/store/hooks'
import { DECISION_TYPES } from '@/types/domain'
import { formatDate } from '@/lib/utils'

export function Decisions() {
  const { decisions, hypotheses } = useProjectData()

  return (
    <div>
      <SectionHeading title="Decisions" sub="Every decision is tied to a hypothesis, the evidence behind it, and what would change your mind. This is your validation audit trail." />

      {decisions.length === 0 ? (
        <EmptyState
          title="No decisions recorded"
          body="Open a hypothesis, consolidate its evidence, and record a decision: continue, narrow, refine, proceed, pause, reject, or pivot."
          action={<Link to="/hypotheses" className="btn-primary">Go to hypotheses</Link>}
        />
      ) : (
        <div className="space-y-3">
          {decisions.map(d => {
            const hyp = hypotheses.find(h => h.id === d.hypothesisId)
            const label = DECISION_TYPES.find(t => t.value === d.decision)?.label
            const tone = d.decision === 'reject' || d.decision === 'pivot' ? 'contra' : d.decision === 'proceed_to_solution' ? 'support' : 'brand'
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Chip tone={tone as any} className="mb-1.5">{label}</Chip>
                    {hyp && <h3 className="font-semibold text-ink"><Link to={`/hypotheses/${hyp.id}`} className="hover:text-brand-600">{hyp.title}</Link></h3>}
                  </div>
                  <span className="text-xs text-ink-faint whitespace-nowrap">{formatDate(d.createdAt)}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Item label="Evidence behind it" value={d.evidenceBasis} />
                  <Item label="Remaining uncertainty" value={d.remainingUncertainty} />
                  <Item label="What we'll test next" value={d.nextTest} />
                  <Item label="What would change our mind" value={d.wouldChangeMind} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Callout tone="info" title="Why decisions live here">
          A validation process is only trustworthy if you can see why each call was made and what evidence
          it rested on. Recording “what would change our mind” up front is what stops confirmation bias later.
        </Callout>
      </div>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-0.5">{label}</p>
      <p className="text-ink-soft">{value || '-'}</p>
    </div>
  )
}
