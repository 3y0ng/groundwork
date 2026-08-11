import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionHeading, Field, Modal, EmptyState, Callout, Chip } from '@/components/ui'
import { EvidenceStrengthMeter, StatusBadge, ConfidenceIndicator } from '@/components/widgets'
import { useProjectData } from '@/store/hooks'
import { useStore, scoreEvidence, evidenceForHypothesis } from '@/store/useStore'
import { HYPOTHESIS_TYPES, type HypothesisType, type Confidence } from '@/types/domain'
import { ai } from '@/ai/engine'
import type { HypothesisRewrite } from '@/ai/schemas'

export function Hypotheses() {
  const { pid, hypotheses, segments, interviews, evidence } = useProjectData()
  const [open, setOpen] = useState(false)

  return (
    <div>
      <SectionHeading
        title="Hypotheses"
        sub="Break your belief into specific, testable claims. Define what would prove each one wrong before you start interviewing."
        action={<button className="btn-primary" onClick={() => setOpen(true)}>+ New hypothesis</button>}
      />

      {hypotheses.length === 0 ? (
        <EmptyState
          title="No hypotheses yet"
          body="A hypothesis names a specific segment, a problem, a context, and a consequence, plus the bar of evidence you'll accept as support."
          action={<button className="btn-primary" onClick={() => setOpen(true)}>Create your first hypothesis</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {hypotheses.map(h => {
            const s = scoreEvidence(evidenceForHypothesis(h.id, evidence))
            const linkedInterviews = interviews.filter(i => i.hypothesisIds.includes(h.id)).length
            const segNames = h.segmentIds.map(id => segments.find(x => x.id === id)?.name).filter(Boolean)
            return (
              <Link key={h.id} to={`/hypotheses/${h.id}`}>
                <Card className="p-4 h-full hover:shadow-pop transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <Chip tone="brand" className="mb-1.5">{HYPOTHESIS_TYPES.find(t => t.value === h.type)?.label}</Chip>
                      <h3 className="font-semibold text-ink leading-snug">{h.title}</h3>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{h.belief}</p>
                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                    <EvidenceStrengthMeter strength={s.strength === 'none' ? h.strength : s.strength} />
                    <span className="text-xs text-ink-faint">{linkedInterviews} interview{linkedInterviews === 1 ? '' : 's'}</span>
                  </div>
                  {segNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {segNames.slice(0, 2).map(n => <Chip key={n}>{n}</Chip>)}
                      {segNames.length > 2 && <Chip>+{segNames.length - 2}</Chip>}
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {open && <NewHypothesisModal projectId={pid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
function NewHypothesisModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { segments } = useProjectData()
  const addHypothesis = useStore(s => s.addHypothesis)

  const [type, setType] = useState<HypothesisType>('problem_exists')
  const [title, setTitle] = useState('')
  // sentence-builder parts
  const [seg, setSeg] = useState('')
  const [problem, setProblem] = useState('')
  const [context, setContext] = useState('')
  const [consequence, setConsequence] = useState('')
  const [evidenceObs, setEvidenceObs] = useState('')
  const [threshold, setThreshold] = useState(4)
  const [disconfirming, setDisconfirming] = useState('')
  const [confidence, setConfidence] = useState<Confidence>('low')
  const [segIds, setSegIds] = useState<string[]>([])
  const [rewrite, setRewrite] = useState<HypothesisRewrite | null>(null)
  const [busy, setBusy] = useState(false)

  const belief = `We believe ${seg || '[segment]'} experiences ${problem || '[problem]'} when ${context || '[context]'}, causing ${consequence || '[consequence]'}. We will treat this as supported when we observe ${evidenceObs || '[evidence]'} across ${threshold} relevant conversations.`

  async function runReview() {
    setBusy(true)
    setRewrite(await ai.rewriteHypothesis(belief))
    setBusy(false)
  }

  function save() {
    addHypothesis({
      projectId, title: title || problem.slice(0, 60) || 'Untitled hypothesis', type, belief,
      segmentIds: segIds, assumptions: [], evidenceRequired: evidenceObs,
      disconfirming: disconfirming || (rewrite?.suggestedDisconfirming ?? ''),
      supportThreshold: threshold, confidence, status: 'testing', strength: 'none',
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} wide title="New hypothesis" sub="Use the sentence builder to force specificity.">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title">
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The learning-loss problem is real" />
          </Field>
          <Field label="Hypothesis type">
            <select className="input" value={type} onChange={e => setType(e.target.value as HypothesisType)}>
              {HYPOTHESIS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Sentence builder */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <p className="section-title mb-3">Sentence builder</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Customer segment"><input className="input" value={seg} onChange={e => setSeg(e.target.value)} placeholder="DTC performance marketers" /></Field>
            <Field label="Problem"><input className="input" value={problem} onChange={e => setProblem(e.target.value)} placeholder="lose learnings from past creative" /></Field>
            <Field label="Context"><input className="input" value={context} onChange={e => setContext(e.target.value)} placeholder="briefing new creative" /></Field>
            <Field label="Consequence"><input className="input" value={consequence} onChange={e => setConsequence(e.target.value)} placeholder="repeating failed approaches, wasting spend" /></Field>
            <Field label="Evidence we'll accept"><input className="input" value={evidenceObs} onChange={e => setEvidenceObs(e.target.value)} placeholder="a specific past repeat-mistake story" /></Field>
            <Field label="Across N conversations"><input type="number" min={1} className="input" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></Field>
          </div>
          <div className="mt-3 rounded-md bg-surface border border-line p-3 text-sm text-ink leading-relaxed">{belief}</div>
          <button className="btn-outline mt-3" onClick={runReview} disabled={busy}>{busy ? 'Reviewing…' : '↺ Review with AI'}</button>
          {rewrite && (
            <div className="mt-3 space-y-2">
              {rewrite.issues.length > 0 ? (
                <Callout tone="warn" title="Make it more testable">
                  <ul className="list-disc pl-4 space-y-0.5">{rewrite.issues.map((i, k) => <li key={k}>{i}</li>)}</ul>
                </Callout>
              ) : (
                <Callout tone="good" title="Looks testable">This hypothesis names a segment, context, and consequence with an observable bar.</Callout>
              )}
              <div className="text-xs text-ink-soft"><span className="font-semibold">Suggested disconfirming evidence:</span> {rewrite.suggestedDisconfirming}
                <button className="ml-2 text-brand-600 hover:underline" onClick={() => setDisconfirming(rewrite.suggestedDisconfirming)}>Use</button>
              </div>
            </div>
          )}
        </div>

        <Field label="Disconfirming evidence" hint="What would you have to see to conclude this is wrong? Decide before you interview.">
          <textarea className="input min-h-[64px]" value={disconfirming} onChange={e => setDisconfirming(e.target.value)} placeholder="Participants describe the situation but take no action and report no consequence." />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Related segments">
            <div className="flex flex-wrap gap-1.5">
              {segments.map(sg => {
                const on = segIds.includes(sg.id)
                return (
                  <button key={sg.id} type="button" onClick={() => setSegIds(on ? segIds.filter(x => x !== sg.id) : [...segIds, sg.id])}
                    className={`chip ${on ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-black/[0.03] text-ink-soft border-line'}`}>
                    {on ? '✓ ' : ''}{sg.name}
                  </button>
                )
              })}
              {segments.length === 0 && <span className="text-xs text-ink-faint">No segments yet.</span>}
            </div>
          </Field>
          <Field label="Starting confidence">
            <select className="input" value={confidence} onChange={e => setConfidence(e.target.value as Confidence)}>
              <option value="very_low">Very low</option><option value="low">Low</option>
              <option value="medium">Medium</option><option value="high">High</option><option value="very_high">Very high</option>
            </select>
            <div className="mt-2"><ConfidenceIndicator confidence={confidence} /></div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Create hypothesis</button>
        </div>
      </div>
    </Modal>
  )
}
