import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Field, Chip, Callout, Meter } from '@/components/ui'
import { EvidenceKindBadge, DirectionBadge } from '@/components/widgets'
import { useStore } from '@/store/useStore'
import { useProjectData } from '@/store/hooks'
import { type EvidenceKind, type EvidenceDirection, type NoteTag } from '@/types/domain'
import { ai } from '@/ai/engine'
import type { InterviewFeedback } from '@/ai/schemas'
import { formatDate, cn } from '@/lib/utils'

const STRUCT_FIELDS: { key: keyof StructKeys; label: string }[] = [
  { key: 'currentWorkflow', label: 'Current workflow' },
  { key: 'triggerEvents', label: 'Trigger events' },
  { key: 'painPoints', label: 'Pain points' },
  { key: 'consequences', label: 'Consequences' },
  { key: 'existingTools', label: 'Existing tools' },
  { key: 'existingSpend', label: 'Existing spend' },
  { key: 'workarounds', label: 'Workarounds' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'severity', label: 'Severity' },
  { key: 'decisionProcess', label: 'Decision process' },
  { key: 'commitments', label: 'Commitments' },
  { key: 'followUps', label: 'Follow-up actions' },
]
type StructKeys = {
  currentWorkflow: string; triggerEvents: string; painPoints: string; consequences: string
  existingTools: string; existingSpend: string; workarounds: string; frequency: string
  severity: string; decisionProcess: string; commitments: string; followUps: string
}

export function InterviewDetail() {
  const { id } = useParams()
  const interview = useStore(s => s.interviews.find(i => i.id === id))
  const updateInterview = useStore(s => s.updateInterview)
  const addEvidence = useStore(s => s.addEvidence)
  const { evidence, hypotheses, segments } = useProjectData()
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
  const [busy, setBusy] = useState<'none' | 'extract' | 'feedback'>('none')
  const [tab, setTab] = useState<'notes' | 'analysis'>('notes')

  if (!interview) return <p className="text-ink-soft">Interview not found. <Link className="text-brand-600" to="/interviews">Back</Link></p>

  const myEvidence = evidence.filter(e => e.interviewId === interview.id)
  const seg = segments.find(s => s.id === interview.segmentId)

  async function runExtraction() {
    setBusy('extract')
    const src = `${interview!.rawNotes}\n${interview!.transcript ?? ''}`
    const { items } = await ai.extractEvidence(src)
    items.forEach(it => {
      addEvidence({
        projectId: interview!.projectId, interviewId: interview!.id, statement: it.statement,
        quote: it.quote, kind: it.kind as EvidenceKind, direction: it.direction as EvidenceDirection,
        hypothesisIds: interview!.hypothesisIds, segmentId: interview!.segmentId,
        strength: it.direction === 'contradicts' ? 'contradicted' : 'weak',
        founderInterpretation: '', aiInterpretation: it.aiInterpretation, tags: it.tags as NoteTag[],
      })
    })
    setBusy('none')
    setTab('analysis')
  }

  async function runFeedback() {
    setBusy('feedback')
    const fb = await ai.feedback(interview!.rawNotes, interview!.transcript)
    fb.summary.hypothesesAffected = interview!.hypothesisIds.map(hid => hypotheses.find(h => h.id === hid)?.title || hid)
    setFeedback(fb)
    setBusy('none')
    setTab('analysis')
  }

  return (
    <div>
      <Link to="/interviews" className="text-sm text-ink-faint hover:text-ink-soft">← Interviews</Link>
      <div className="flex items-start justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">{interview.participantName}</h1>
          <p className="text-sm text-ink-soft">{interview.role} · {interview.company} · {formatDate(interview.date)}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {seg && <Chip tone="brand">{seg.name}</Chip>}
            {interview.hypothesisIds.map(hid => <Chip key={hid}>{hypotheses.find(h => h.id === hid)?.title}</Chip>)}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-outline" onClick={runExtraction} disabled={busy !== 'none'}>{busy === 'extract' ? 'Extracting…' : 'Extract evidence'}</button>
          <button className="btn-primary" onClick={runFeedback} disabled={busy !== 'none'}>{busy === 'feedback' ? 'Reviewing…' : 'Get feedback'}</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-line mb-4">
        {(['notes', 'analysis'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-2 text-sm font-medium -mb-px border-b-2', tab === t ? 'border-brand-500 text-ink' : 'border-transparent text-ink-faint hover:text-ink-soft')}>
            {t === 'notes' ? 'Notes & structure' : `Analysis${myEvidence.length ? ` · ${myEvidence.length}` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'notes' ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <p className="section-title mb-2">Raw notes</p>
              <textarea className="input min-h-[220px] font-mono text-[13px]" value={interview.rawNotes} onChange={e => updateInterview(interview.id, { rawNotes: e.target.value })} />
            </Card>
            {interview.transcript && (
              <Card className="p-5">
                <p className="section-title mb-2">Transcript</p>
                <textarea className="input min-h-[160px] font-mono text-[13px]" value={interview.transcript} onChange={e => updateInterview(interview.id, { transcript: e.target.value })} />
              </Card>
            )}
          </div>
          <Card className="p-5 h-fit">
            <p className="section-title mb-3">Structured capture</p>
            <div className="space-y-2.5">
              {STRUCT_FIELDS.map(f => (
                <Field key={f.key} label={f.label}>
                  <input className="input py-1.5 text-[13px]" value={(interview as any)[f.key] ?? ''} onChange={e => updateInterview(interview.id, { [f.key]: e.target.value } as any)} />
                </Field>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {myEvidence.length === 0 && !feedback && (
            <Callout tone="info" title="Run the analysis">Use <strong>Extract evidence</strong> to pull classified, quote-backed evidence from the notes, and <strong>Get feedback</strong> to score the interview quality. Nothing is invented — every quote comes straight from your notes.</Callout>
          )}

          {feedback && <FeedbackPanel fb={feedback} />}

          {myEvidence.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Extracted evidence</h2>
                <span className="text-xs text-ink-faint">Original text kept separate from interpretation.</span>
              </div>
              <div className="space-y-2.5">
                {myEvidence.map(e => (
                  <EvidenceRow key={e.id} e={e} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function EvidenceRow({ e }: { e: ReturnType<typeof useProjectData>['evidence'][number] }) {
  const updateEvidence = useStore(s => s.updateEvidence)
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <EvidenceKindBadge kind={e.kind} />
        <DirectionBadge direction={e.direction} />
        {e.tags.map(t => <Chip key={t}>{t.replace('_', ' ')}</Chip>)}
      </div>
      <blockquote className="text-sm text-ink border-l-2 border-line pl-3 italic">"{e.quote}"</blockquote>
      <p className="text-xs text-ink-soft mt-2"><span className="font-semibold text-brand-600">AI read:</span> {e.aiInterpretation}</p>
      <div className="mt-2">
        <input className="input py-1.5 text-[13px]" placeholder="Your interpretation (kept separate from the AI's)…" value={e.founderInterpretation} onChange={ev => updateEvidence(e.id, { founderInterpretation: ev.target.value })} />
      </div>
    </div>
  )
}

function FeedbackPanel({ fb }: { fb: InterviewFeedback }) {
  const scoreTone = fb.overallScore >= 70 ? 'text-support-fg' : fb.overallScore >= 45 ? 'text-unclear-fg' : 'text-contra-fg'
  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <p className={cn('text-4xl font-semibold', scoreTone)}>{fb.overallScore}</p>
          <p className="text-xs text-ink-faint">interview quality</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-ink-soft">A score alone means little — the value is in the per-dimension feedback below and the follow-ups you missed.</p>
          {fb.talkRatio && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1"><span className="text-ink-soft">You {fb.talkRatio.interviewerPct}%</span><span className="text-ink-soft">Them {fb.talkRatio.customerPct}%</span></div>
              <div className="h-2 rounded-full overflow-hidden flex">
                <div className="bg-brand-500" style={{ width: `${fb.talkRatio.interviewerPct}%` }} />
                <div className="bg-support-fg" style={{ width: `${fb.talkRatio.customerPct}%` }} />
              </div>
              <p className="text-xs text-ink-faint mt-1">{fb.talkRatio.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <p className="section-title mb-2">Quality by dimension</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {fb.dimensions.map(d => (
            <div key={d.key} className="rounded-lg border border-line p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink">{d.label}</span>
                <span className={cn('text-xs font-semibold', d.score >= 4 ? 'text-support-fg' : d.score <= 2 ? 'text-contra-fg' : 'text-unclear-fg')}>{d.score}/5</span>
              </div>
              <Meter value={d.score} max={5} tone={d.score >= 4 ? 'support' : d.score <= 2 ? 'contra' : 'unclear'} />
              {d.score < 4 && (
                <div className="mt-2 text-xs text-ink-soft space-y-1">
                  <p><span className="font-semibold">What happened:</span> {d.whatHappened}</p>
                  <p><span className="font-semibold">Why it matters:</span> {d.whyItMatters}</p>
                  {d.betterQuestion && <p className="text-support-fg"><span className="font-semibold">Try:</span> "{d.betterQuestion}"</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Missed follow-ups */}
      {fb.missedFollowUps.length > 0 && (
        <div>
          <p className="section-title mb-2">Missed follow-ups</p>
          <div className="space-y-2">
            {fb.missedFollowUps.map((m, k) => (
              <div key={k} className="rounded-lg border border-line p-3">
                <p className="text-sm text-ink italic">"{m.statement}"</p>
                <p className="text-xs text-ink-faint mt-1 mb-1">Should have followed up with:</p>
                <div className="flex flex-wrap gap-1">{m.suggestedFollowUps.map((q, i) => <Chip key={i} tone="brand">{q}</Chip>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-line text-sm">
        <SummaryItem label="Strongest evidence" tone="support" value={fb.summary.strongestEvidence} />
        <SummaryItem label="Weakest evidence" tone="contra" value={fb.summary.weakestEvidence} />
        <SummaryItem label="Surprising insight" value={fb.summary.surprisingInsight} />
        <SummaryItem label="Contradiction" tone="contra" value={fb.summary.contradiction} />
        <SummaryItem label="Open question" value={fb.summary.openQuestion} />
        <SummaryItem label="Recommended next question" tone="support" value={fb.summary.recommendedNextQuestion} />
      </div>
      {fb.summary.hypothesesAffected.length > 0 && (
        <div className="text-xs text-ink-faint">Hypotheses affected: {fb.summary.hypothesesAffected.join(', ')}</div>
      )}
    </Card>
  )
}

function SummaryItem({ label, value, tone }: { label: string; value: string; tone?: 'support' | 'contra' }) {
  const color = tone === 'support' ? 'text-support-fg' : tone === 'contra' ? 'text-contra-fg' : 'text-ink-faint'
  return (
    <div>
      <p className={cn('text-xs font-semibold uppercase tracking-wide mb-0.5', color)}>{label}</p>
      <p className="text-ink-soft">{value}</p>
    </div>
  )
}
