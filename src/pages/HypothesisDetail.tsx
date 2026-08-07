import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Field, Callout, Chip, Modal } from '@/components/ui'
import { EvidenceStrengthMeter, StatusBadge, ConfidenceIndicator } from '@/components/widgets'
import { useStore, scoreEvidence, evidenceForHypothesis } from '@/store/useStore'
import { useProjectData } from '@/store/hooks'
import { HYPOTHESIS_TYPES, DECISION_TYPES, type DecisionType, type HypothesisStatus, type EvidenceStrength } from '@/types/domain'
import { ai } from '@/ai/engine'
import type { Consolidation, DecisionRecommendation } from '@/ai/schemas'
import { formatDate } from '@/lib/utils'

const STRENGTH_TO_STATUS: Record<string, HypothesisStatus> = {
  strong: 'supported', mixed: 'partially_supported', weak: 'inconclusive',
  none: 'inconclusive', contradicted: 'contradicted',
}

export function HypothesisDetail() {
  const { id } = useParams()
  const hypothesis = useStore(s => s.hypotheses.find(h => h.id === id))
  const { interviews, evidence, segments, decisions } = useProjectData()
  const updateHypothesis = useStore(s => s.updateHypothesis)
  const saveDecision = useStore(s => s.saveDecision)

  const [consolidation, setConsolidation] = useState<Consolidation | null>(null)
  const [rec, setRec] = useState<DecisionRecommendation | null>(null)
  const [busy, setBusy] = useState(false)
  const [decisionOpen, setDecisionOpen] = useState(false)

  const linkedInterviews = useMemo(
    () => interviews.filter(i => hypothesis && i.hypothesisIds.includes(hypothesis.id)),
    [interviews, hypothesis],
  )
  const linkedEvidence = hypothesis ? evidenceForHypothesis(hypothesis.id, evidence) : []
  const score = scoreEvidence(linkedEvidence)
  const existingDecision = decisions.find(d => d.hypothesisId === id)

  if (!hypothesis) return <p className="text-ink-soft">Hypothesis not found. <Link className="text-brand-600" to="/hypotheses">Back</Link></p>

  async function consolidate() {
    setBusy(true)
    const rows = linkedInterviews.map(i => ({
      label: i.participantName,
      text: [i.painPoints, i.consequences, i.frequency, i.existingSpend, i.commitments].filter(Boolean).join(' '),
    }))
    const c = await ai.consolidate(hypothesis!.belief, rows)
    c.matchingSegments = new Set(linkedInterviews.map(i => i.segmentId).filter(Boolean)).size
    setConsolidation(c)
    setRec(await ai.recommendDecision(hypothesis!.belief, c))
    // reflect the AI's quality-weighted read back into the hypothesis record
    updateHypothesis(hypothesis!.id, { strength: c.recommendedStrength as EvidenceStrength, status: STRENGTH_TO_STATUS[c.recommendedStrength] })
    setBusy(false)
  }

  return (
    <div>
      <Link to="/hypotheses" className="text-sm text-ink-faint hover:text-ink-soft">← Hypotheses</Link>
      <div className="flex items-start justify-between gap-4 mt-2 mb-5">
        <div>
          <Chip tone="brand" className="mb-2">{HYPOTHESIS_TYPES.find(t => t.value === hypothesis.type)?.label}</Chip>
          <h1 className="text-xl font-semibold text-ink">{hypothesis.title}</h1>
        </div>
        <StatusBadge status={hypothesis.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <p className="section-title mb-2">Belief</p>
            <p className="text-[15px] text-ink leading-relaxed">{hypothesis.belief}</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line">
              <div>
                <p className="section-title mb-1">Evidence required</p>
                <p className="text-sm text-ink-soft">{hypothesis.evidenceRequired || '—'}</p>
              </div>
              <div>
                <p className="section-title mb-1 text-contra-fg">Disconfirming evidence</p>
                <p className="text-sm text-ink-soft">{hypothesis.disconfirming || '—'}</p>
              </div>
            </div>
          </Card>

          {/* Evidence table: one row per interview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Evidence across conversations</h2>
              <button className="btn-primary" onClick={consolidate} disabled={busy || linkedInterviews.length === 0}>
                {busy ? 'Consolidating…' : '↺ Consolidate evidence'}
              </button>
            </div>

            {linkedInterviews.length === 0 ? (
              <p className="text-sm text-ink-faint py-6 text-center">No interviews are linked to this hypothesis yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-faint border-b border-line">
                      <th className="font-medium py-2 pr-3">Participant</th>
                      <th className="font-medium py-2 pr-3">Segment</th>
                      <th className="font-medium py-2 pr-3">Signal</th>
                      <th className="font-medium py-2">Read</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedInterviews.map(i => {
                      const segName = segments.find(s => s.id === i.segmentId)?.name ?? '—'
                      const read = readInterview(i)
                      return (
                        <tr key={i.id} className="border-b border-line/60 align-top">
                          <td className="py-2.5 pr-3">
                            <Link to={`/interviews/${i.id}`} className="font-medium text-ink hover:text-brand-600">{i.participantName}</Link>
                            <div className="text-xs text-ink-faint">{formatDate(i.date)}</div>
                          </td>
                          <td className="py-2.5 pr-3 text-ink-soft">{segName}</td>
                          <td className="py-2.5 pr-3 max-w-[220px]">
                            <span className="text-ink-soft line-clamp-2">{i.consequences || i.painPoints || '—'}</span>
                          </td>
                          <td className="py-2.5"><Chip tone={read.tone as any}>{read.label}</Chip></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {consolidation && <ConsolidationView c={consolidation} rec={rec} onDecide={() => setDecisionOpen(true)} />}
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="section-title mb-2">Current evidence strength</p>
            <EvidenceStrengthMeter strength={score.strength === 'none' ? hypothesis.strength : score.strength} />
            <p className="text-xs text-ink-faint mt-2">Weighted by evidence quality, not interview count. {score.behaviourItems} behaviour/commitment item{score.behaviourItems === 1 ? '' : 's'} logged.</p>
            <div className="mt-4 pt-4 border-t border-line">
              <p className="section-title mb-2">Confidence</p>
              <ConfidenceIndicator confidence={hypothesis.confidence} />
            </div>
            <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-3 text-center">
              <div><p className="text-xl font-semibold">{linkedInterviews.length}</p><p className="text-xs text-ink-faint">interviews</p></div>
              <div><p className="text-xl font-semibold">{hypothesis.supportThreshold}</p><p className="text-xs text-ink-faint">needed to support</p></div>
            </div>
          </Card>

          {existingDecision && (
            <Card className="p-5">
              <p className="section-title mb-2">Recorded decision</p>
              <Chip tone="brand">{DECISION_TYPES.find(d => d.value === existingDecision.decision)?.label}</Chip>
              <p className="text-sm text-ink-soft mt-2">{existingDecision.evidenceBasis}</p>
            </Card>
          )}
        </div>
      </div>

      {decisionOpen && (
        <DecisionModal
          hypothesisTitle={hypothesis.title}
          recommendation={rec}
          onClose={() => setDecisionOpen(false)}
          onSave={payload => { saveDecision({ projectId: hypothesis.projectId, hypothesisId: hypothesis.id, ...payload }); setDecisionOpen(false) }}
        />
      )}
    </div>
  )
}

function ConsolidationView({ c, rec, onDecide }: { c: Consolidation; rec: DecisionRecommendation | null; onDecide: () => void }) {
  const conclusionTone = c.conclusion === 'supported' ? 'good' : c.conclusion === 'contradicted' ? 'warn' : 'info'
  const label = { supported: 'Supported', partially_supported: 'Partially supported', inconclusive: 'Inconclusive', contradicted: 'Contradicted' }[c.conclusion]
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Consolidated conclusion</h2>
        <EvidenceStrengthMeter strength={c.recommendedStrength as EvidenceStrength} />
      </div>
      <Callout tone={conclusionTone as any} title={label}>{c.reasoning}</Callout>

      <div className="grid sm:grid-cols-2 gap-4">
        <EvidenceCol title="Supporting" tone="support" items={c.supporting} />
        <EvidenceCol title="Contradicting" tone="contra" items={c.contradicting} />
      </div>
      {c.unclear.length > 0 && <EvidenceCol title="Unclear" tone="unclear" items={c.unclear} />}

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-line text-sm">
        <MiniList title="Patterns" items={c.patterns} />
        <MiniList title="Outliers" items={c.outliers} />
        <MiniList title="Existing spending" items={c.existingSpending} />
        <MiniList title="Unanswered questions" items={c.unansweredQuestions} />
      </div>
      <div className="text-sm text-ink-soft"><span className="font-semibold text-ink">Commitment strength:</span> {c.commitmentStrength}</div>
      <p className="text-xs text-ink-faint">Based on {c.relevantConversations} conversation{c.relevantConversations === 1 ? '' : 's'} across {c.matchingSegments} segment{c.matchingSegments === 1 ? '' : 's'} — weighted by quality, not majority vote.</p>

      {rec && (
        <div className="pt-4 border-t border-line">
          <p className="section-title mb-2">Recommended decision</p>
          <div className="flex items-start gap-3">
            <Chip tone="brand">{DECISION_TYPES.find(d => d.value === rec.recommended)?.label}</Chip>
          </div>
          <p className="text-sm text-ink-soft mt-2">{rec.reasoning}</p>
          <p className="text-sm text-ink-soft mt-1"><span className="font-medium text-ink">Next test:</span> {rec.suggestedNextTest}</p>
          <div className="mt-3 flex items-center gap-3">
            <button className="btn-primary" onClick={onDecide}>Record a decision</button>
            <span className="text-xs text-ink-faint">You own the final call — this is advice, not a verdict.</span>
          </div>
        </div>
      )}
    </Card>
  )
}

function EvidenceCol({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: tone === 'support' ? '#1c7a44' : tone === 'contra' ? '#b3261e' : '#9a6b12' }}>{title} ({items.length})</p>
      <ul className="space-y-1.5">
        {items.length === 0 ? <li className="text-xs text-ink-faint">None</li> : items.map((it, k) => (
          <li key={k} className="text-sm text-ink-soft leading-snug pl-3 border-l-2" style={{ borderColor: tone === 'support' ? '#bfe6cd' : tone === 'contra' ? '#f6c9c6' : '#efdcb2' }}>{it}</li>
        ))}
      </ul>
    </div>
  )
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-faint mb-1">{title}</p>
      <ul className="list-disc pl-4 space-y-0.5 text-ink-soft">
        {items.length ? items.map((i, k) => <li key={k}>{i}</li>) : <li className="list-none text-ink-faint -ml-4">—</li>}
      </ul>
    </div>
  )
}

function DecisionModal({
  hypothesisTitle, recommendation, onClose, onSave,
}: {
  hypothesisTitle: string
  recommendation: DecisionRecommendation | null
  onClose: () => void
  onSave: (p: { decision: DecisionType; evidenceBasis: string; remainingUncertainty: string; nextTest: string; wouldChangeMind: string }) => void
}) {
  const [decision, setDecision] = useState<DecisionType>(recommendation?.recommended ?? 'continue_testing')
  const [evidenceBasis, setEvidenceBasis] = useState('')
  const [remainingUncertainty, setRemainingUncertainty] = useState(recommendation?.remainingUncertainty ?? '')
  const [nextTest, setNextTest] = useState(recommendation?.suggestedNextTest ?? '')
  const [wouldChangeMind, setWouldChangeMind] = useState('')

  return (
    <Modal open onClose={onClose} wide title="Record a decision" sub={hypothesisTitle}>
      <div className="space-y-4">
        {recommendation && <Callout tone="info" title={`AI recommends: ${DECISION_TYPES.find(d => d.value === recommendation.recommended)?.label}`}>{recommendation.reasoning}</Callout>}
        <Field label="Your decision">
          <select className="input" value={decision} onChange={e => setDecision(e.target.value as DecisionType)}>
            {DECISION_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Field>
        <Field label="Evidence behind the decision" hint="Point to the specific behaviour, spend, or commitments — not a headcount."><textarea className="input min-h-[70px]" value={evidenceBasis} onChange={e => setEvidenceBasis(e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Remaining uncertainty"><textarea className="input min-h-[70px]" value={remainingUncertainty} onChange={e => setRemainingUncertainty(e.target.value)} /></Field>
          <Field label="What you'll test next"><textarea className="input min-h-[70px]" value={nextTest} onChange={e => setNextTest(e.target.value)} /></Field>
        </div>
        <Field label="What would change your mind" hint="Name it now, before new evidence arrives."><textarea className="input min-h-[60px]" value={wouldChangeMind} onChange={e => setWouldChangeMind(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ decision, evidenceBasis, remainingUncertainty, nextTest, wouldChangeMind })}>Save decision</button>
        </div>
      </div>
    </Modal>
  )
}

// Quick per-interview read used in the evidence table.
function readInterview(i: { consequences: string; existingSpend: string; painPoints: string; frequency: string }) {
  const blob = `${i.consequences} ${i.existingSpend} ${i.painPoints}`.toLowerCase()
  if (/(not really|no big deal|not a problem|fine as is|remember them fine|not a top)/.test(blob)) return { label: 'Contradicts', tone: 'contra' }
  if (/(\$|paid|subscription|wasted|jumped|cost|pilot)/.test(blob)) return { label: 'Supports', tone: 'support' }
  return { label: 'Unclear', tone: 'unclear' }
}
