import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionHeading, EmptyState, Chip } from '@/components/ui'
import { EvidenceKindBadge, DirectionBadge } from '@/components/widgets'
import { useProjectData } from '@/store/hooks'
import { EVIDENCE_KIND, NOTE_TAGS, type EvidenceKind, type EvidenceDirection, type NoteTag } from '@/types/domain'
import { formatDate, cn } from '@/lib/utils'

export function EvidenceBoard() {
  const { evidence, interviews, hypotheses, segments } = useProjectData()

  const [dir, setDir] = useState<'all' | EvidenceDirection>('all')
  const [kind, setKind] = useState<'all' | EvidenceKind>('all')
  const [hyp, setHyp] = useState('all')
  const [seg, setSeg] = useState('all')
  const [tag, setTag] = useState<'all' | NoteTag>('all')

  const filtered = useMemo(() => evidence.filter(e =>
    (dir === 'all' || e.direction === dir) &&
    (kind === 'all' || e.kind === kind) &&
    (hyp === 'all' || e.hypothesisIds.includes(hyp)) &&
    (seg === 'all' || e.segmentId === seg) &&
    (tag === 'all' || e.tags.includes(tag)),
  ), [evidence, dir, kind, hyp, seg, tag])

  const counts = {
    supports: evidence.filter(e => e.direction === 'supports').length,
    contradicts: evidence.filter(e => e.direction === 'contradicts').length,
    unclear: evidence.filter(e => e.direction === 'unclear').length,
  }

  return (
    <div>
      <SectionHeading title="Evidence Board" sub="Every quote-backed piece of evidence in one place. Filter to see what supports and what contradicts — never just the encouraging half." />

      {evidence.length === 0 ? (
        <EmptyState title="No evidence yet" body="Open an interview and run “Extract evidence” to populate the board. Each card keeps the original quote separate from any interpretation." action={<Link to="/interviews" className="btn-primary">Go to interviews</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryPill label="Supporting" n={counts.supports} tone="support" active={dir === 'supports'} onClick={() => setDir(dir === 'supports' ? 'all' : 'supports')} />
            <SummaryPill label="Contradicting" n={counts.contradicts} tone="contra" active={dir === 'contradicts'} onClick={() => setDir(dir === 'contradicts' ? 'all' : 'contradicts')} />
            <SummaryPill label="Unclear" n={counts.unclear} tone="unclear" active={dir === 'unclear'} onClick={() => setDir(dir === 'unclear' ? 'all' : 'unclear')} />
          </div>

          <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-ink-faint px-1">Filter</span>
            <Select value={kind} onChange={setKind as any} label="Kind">
              <option value="all">All kinds</option>
              {Object.entries(EVIDENCE_KIND).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            <Select value={hyp} onChange={setHyp} label="Hypothesis">
              <option value="all">All hypotheses</option>
              {hypotheses.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
            </Select>
            <Select value={seg} onChange={setSeg} label="Segment">
              <option value="all">All segments</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select value={tag} onChange={setTag as any} label="Tag">
              <option value="all">All tags</option>
              {NOTE_TAGS.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Select>
            {(dir !== 'all' || kind !== 'all' || hyp !== 'all' || seg !== 'all' || tag !== 'all') && (
              <button className="btn-ghost text-xs py-1" onClick={() => { setDir('all'); setKind('all'); setHyp('all'); setSeg('all'); setTag('all') }}>Reset</button>
            )}
            <span className="ml-auto text-xs text-ink-faint">{filtered.length} of {evidence.length}</span>
          </Card>

          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(e => {
              const interview = interviews.find(i => i.id === e.interviewId)
              const segName = segments.find(s => s.id === e.segmentId)?.name
              const borderTone = e.direction === 'supports' ? 'border-l-support-fg' : e.direction === 'contradicts' ? 'border-l-contra-fg' : 'border-l-unclear-fg'
              return (
                <Card key={e.id} className={cn('p-4 border-l-4', borderTone)}>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <EvidenceKindBadge kind={e.kind} />
                    <DirectionBadge direction={e.direction} />
                  </div>
                  <blockquote className="text-sm text-ink italic border-l-2 border-line pl-3">"{e.quote}"</blockquote>
                  <p className="text-xs text-ink-soft mt-2"><span className="font-semibold text-brand-600">AI read:</span> {e.aiInterpretation}</p>
                  {e.founderInterpretation && <p className="text-xs text-ink-soft mt-1"><span className="font-semibold">Your read:</span> {e.founderInterpretation}</p>}
                  <div className="mt-3 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-faint">
                    <Link to={`/interviews/${e.interviewId}`} className="hover:text-brand-600">{interview?.participantName ?? 'Interview'}</Link>
                    <span>{segName ? `${segName} · ` : ''}{formatDate(e.createdAt)}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryPill({ label, n, tone, active, onClick }: { label: string; n: number; tone: 'support' | 'contra' | 'unclear'; active: boolean; onClick: () => void }) {
  const bg = tone === 'support' ? 'bg-support-bg text-support-fg' : tone === 'contra' ? 'bg-contra-bg text-contra-fg' : 'bg-unclear-bg text-unclear-fg'
  return (
    <button onClick={onClick} className={cn('card p-4 text-left transition-all', active && 'ring-2 ring-offset-1 ring-brand-500/40')}>
      <span className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold mb-2', bg)}>{n}</span>
      <p className="text-sm font-medium text-ink">{label}</p>
    </button>
  )
}

function Select({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30">
      {children}
    </select>
  )
}
