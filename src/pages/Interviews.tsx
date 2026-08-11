import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Card, SectionHeading, Field, Modal, EmptyState, Chip, Callout } from '@/components/ui'
import { QuestionWarning } from '@/components/widgets'
import { useProjectData } from '@/store/hooks'
import { useStore } from '@/store/useStore'
import { QUESTION_SECTIONS, type QuestionSection } from '@/types/domain'
import { ai } from '@/ai/engine'
import type { InterviewGuide, QuestionReview } from '@/ai/schemas'
import { formatDate, uid } from '@/lib/utils'

export function Interviews() {
  const { pid, interviews, segments, hypotheses } = useProjectData()
  const [planOpen, setPlanOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  return (
    <div>
      <SectionHeading
        title="Interviews"
        sub="Generate a plan that digs into real past behaviour, then capture what you heard. Weak questions get flagged before you ask them."
        action={
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => setPlanOpen(true)}>Plan questions</button>
            <button className="btn-primary" onClick={() => setNewOpen(true)}>+ Log interview</button>
          </div>
        }
      />

      {interviews.length === 0 ? (
        <EmptyState title="No interviews yet" body="Log a conversation to extract evidence, get quality feedback, and tie what you heard back to your hypotheses." action={<button className="btn-primary" onClick={() => setNewOpen(true)}>Log your first interview</button>} />
      ) : (
        <div className="space-y-2.5">
          {interviews.map(i => {
            const seg = segments.find(s => s.id === i.segmentId)
            return (
              <Link key={i.id} to={`/interviews/${i.id}`}>
                <Card className="p-4 hover:shadow-pop transition-shadow flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{i.participantName}</span>
                      <span className="text-sm text-ink-faint">· {i.role}, {i.company}</span>
                    </div>
                    <p className="text-sm text-ink-soft line-clamp-1 mt-0.5">{i.painPoints || i.rawNotes.slice(0, 120)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {seg && <Chip>{seg.name.split(' ').slice(0, 3).join(' ')}</Chip>}
                    <span className="text-xs text-ink-faint">{formatDate(i.date)}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {planOpen && <PlannerModal onClose={() => setPlanOpen(false)} />}
      {newOpen && <NewInterviewModal projectId={pid!} onClose={() => setNewOpen(false)} />}
    </div>
  )
}

// --- Interview planner -----------------------------------------------------
function PlannerModal({ onClose }: { onClose: () => void }) {
  const { hypotheses, segments } = useProjectData()
  const addTemplate = useStore(s => s.addTemplate)
  const pid = useStore(s => s.activeProjectId!)

  const [hypId, setHypId] = useState(hypotheses[0]?.id ?? '')
  const [segId, setSegId] = useState(segments[0]?.id ?? '')
  const [objective, setObjective] = useState('')
  const [known, setKnown] = useState('')
  const [uncertain, setUncertain] = useState('')
  const [guide, setGuide] = useState<InterviewGuide | null>(null)
  const [busy, setBusy] = useState(false)
  const [check, setCheck] = useState('')
  const [review, setReview] = useState<QuestionReview | null>(null)

  async function generate() {
    setBusy(true)
    const hyp = hypotheses.find(h => h.id === hypId)
    const seg = segments.find(s => s.id === segId)
    setGuide(await ai.generateGuide({ hypothesis: hyp?.belief ?? '', segment: seg?.name ?? '', objective, known, uncertain }))
    setBusy(false)
  }

  async function reviewQuestion() {
    if (!check.trim()) return
    setReview(await ai.reviewQuestion(check))
  }

  const bySection = (guide?.questions ?? []).reduce((acc, q) => {
    ;(acc[q.section] ||= []).push(q)
    return acc
  }, {} as Record<string, InterviewGuide['questions']>)

  return (
    <Modal open onClose={onClose} wide title="Interview planner" sub="Targeted, conversational questions grounded in past behaviour.">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Hypothesis under test"><select className="input" value={hypId} onChange={e => setHypId(e.target.value)}>{hypotheses.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}</select></Field>
          <Field label="Segment"><select className="input" value={segId} onChange={e => setSegId(e.target.value)}>{segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        </div>
        <Field label="Interview objective"><input className="input" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Understand how they handle creative learnings today" /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="What you already know"><textarea className="input min-h-[56px]" value={known} onChange={e => setKnown(e.target.value)} /></Field>
          <Field label="What remains uncertain"><textarea className="input min-h-[56px]" value={uncertain} onChange={e => setUncertain(e.target.value)} /></Field>
        </div>
        <button className="btn-primary" onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate interview guide'}</button>

        {guide && (
          <div className="space-y-3 pt-2">
            {QUESTION_SECTIONS.filter(s => bySection[s.value]?.length).map(s => (
              <div key={s.value}>
                <p className="section-title mb-1.5">{s.label}</p>
                <ul className="space-y-1.5">
                  {bySection[s.value].map((q, k) => (
                    <li key={k} className="rounded-lg border border-line p-2.5">
                      <p className="text-sm text-ink">{q.text}</p>
                      {q.rationale && <p className="text-xs text-ink-faint mt-0.5">{q.rationale}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button className="btn-outline" onClick={() => { addTemplate({ projectId: pid, name: `Guide · ${objective || 'interview'}`, questions: guide.questions.map(q => ({ id: uid('q'), section: q.section as QuestionSection, text: q.text, rationale: q.rationale })) }); onClose() }}>Save as template</button>
          </div>
        )}

        {/* Question checker */}
        <div className="rounded-lg border border-line bg-canvas p-4">
          <p className="section-title mb-2">Check a question before you ask it</p>
          <div className="flex gap-2">
            <input className="input" value={check} onChange={e => setCheck(e.target.value)} placeholder="Would you use an AI tool for this?" onKeyDown={e => e.key === 'Enter' && reviewQuestion()} />
            <button className="btn-outline shrink-0" onClick={reviewQuestion}>Review</button>
          </div>
          {review && (
            <div className="mt-3">
              {review.verdict === 'weak'
                ? <QuestionWarning problem={review.problem!} reason={review.reason!} replacement={review.replacement!} />
                : <Callout tone="good" title="Strong question">{review.reason}</Callout>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// --- New interview ---------------------------------------------------------
function NewInterviewModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { segments, hypotheses } = useProjectData()
  const addInterview = useStore(s => s.addInterview)
  const navigate = useNavigate()

  const [participantName, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [segmentId, setSegmentId] = useState<string>(segments[0]?.id ?? '')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [hypIds, setHypIds] = useState<string[]>([])
  const [rawNotes, setRawNotes] = useState('')

  function save() {
    const id = addInterview({
      projectId, participantName: participantName || 'Participant', company, role, segmentId, date,
      interviewer: 'You', hypothesisIds: hypIds, rawNotes, keyQuotes: [], currentWorkflow: '', triggerEvents: '',
      painPoints: '', consequences: '', existingTools: '', existingSpend: '', workarounds: '', frequency: '',
      severity: '', decisionProcess: '', commitments: '', followUps: '',
    })
    navigate(`/interviews/${id}`)
    onClose()
  }

  return (
    <Modal open onClose={onClose} wide title="Log interview" sub="Capture fast now, structure and analysis come next.">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Participant"><input className="input" value={participantName} onChange={e => setName(e.target.value)} /></Field>
          <Field label="Company"><input className="input" value={company} onChange={e => setCompany(e.target.value)} /></Field>
          <Field label="Role"><input className="input" value={role} onChange={e => setRole(e.target.value)} /></Field>
          <Field label="Segment"><select className="input" value={segmentId} onChange={e => setSegmentId(e.target.value)}><option value="">-</option>{segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Hypotheses tested">
          <div className="flex flex-wrap gap-1.5">
            {hypotheses.map(h => {
              const on = hypIds.includes(h.id)
              return <button key={h.id} type="button" onClick={() => setHypIds(on ? hypIds.filter(x => x !== h.id) : [...hypIds, h.id])} className={`chip ${on ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-black/[0.03] text-ink-soft border-line'}`}>{on ? '✓ ' : ''}{h.title}</button>
            })}
          </div>
        </Field>
        <Field label="Raw notes" hint="Type freely during the call. You'll tag and analyse this on the next screen.">
          <textarea className="input min-h-[140px] font-mono text-[13px]" value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="Last time this happened… what they did… what it cost…" />
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save & analyse →</button>
        </div>
      </div>
    </Modal>
  )
}
