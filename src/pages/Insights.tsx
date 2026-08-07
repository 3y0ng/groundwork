import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionHeading, EmptyState, Chip, Field, Modal } from '@/components/ui'
import { useProjectData } from '@/store/hooks'
import { useStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'

const LEVELS = ['project', 'hypothesis', 'segment', 'interview'] as const

export function Insights() {
  const { pid, insights, hypotheses } = useProjectData()
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState<'all' | (typeof LEVELS)[number]>('all')

  const filtered = insights.filter(i => level === 'all' || i.level === level)

  return (
    <div>
      <SectionHeading
        title="Insights"
        sub="Durable takeaways that cut across conversations. Insights can attach to the whole project, a hypothesis, a segment, or a single interview."
        action={<button className="btn-primary" onClick={() => setOpen(true)}>+ Capture insight</button>}
      />

      <div className="flex gap-1.5 mb-4">
        {(['all', ...LEVELS] as const).map(l => (
          <button key={l} onClick={() => setLevel(l)} className={`chip capitalize ${level === l ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-black/[0.03] text-ink-soft border-line'}`}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No insights captured" body="After analysing interviews, record the patterns that will actually shape your decisions — especially the uncomfortable ones." action={<button className="btn-primary" onClick={() => setOpen(true)}>Capture an insight</button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(i => {
            const hyp = i.level === 'hypothesis' ? hypotheses.find(h => h.id === i.refId) : null
            return (
              <Card key={i.id} className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <Chip tone="brand" className="capitalize">{i.level}</Chip>
                  <span className="text-xs text-ink-faint">{formatDate(i.createdAt)}</span>
                </div>
                <h3 className="font-semibold text-ink">{i.title}</h3>
                <p className="text-sm text-ink-soft mt-1 leading-relaxed">{i.body}</p>
                {hyp && <Link to={`/hypotheses/${hyp.id}`} className="text-xs text-brand-600 hover:underline mt-2 inline-block">→ {hyp.title}</Link>}
              </Card>
            )
          })}
        </div>
      )}

      {open && <NewInsightModal projectId={pid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

function NewInsightModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const addInsight = useStore(s => s.addInsight)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('project')
  return (
    <Modal open onClose={onClose} title="Capture insight">
      <div className="space-y-4">
        <Field label="Level"><select className="input capitalize" value={level} onChange={e => setLevel(e.target.value as any)}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></Field>
        <Field label="Title"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Insight" hint="What did you learn, and what does it change?"><textarea className="input min-h-[100px]" value={body} onChange={e => setBody(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { addInsight({ projectId, level, title: title || 'Insight', body }); onClose() }}>Save</button>
        </div>
      </div>
    </Modal>
  )
}
