import { useState } from 'react'
import { Card, SectionHeading, Field, Modal, EmptyState, Chip, Callout } from '@/components/ui'
import { useProjectData } from '@/store/hooks'
import { useStore, scoreEvidence } from '@/store/useStore'
import type { CustomerSegment } from '@/types/domain'
import { cn } from '@/lib/utils'

// ICP prioritisation dimensions, each scored 1-5 from segment fields.
const MATRIX_DIMS: { key: string; label: string; get: (s: CustomerSegment, ctx: Ctx) => number }[] = [
  { key: 'severity', label: 'Severity', get: s => s.severity },
  { key: 'frequency', label: 'Frequency', get: s => freqScore(s.frequency) },
  { key: 'urgency', label: 'Urgency', get: s => Math.round((s.severity + freqScore(s.frequency)) / 2) },
  { key: 'spend', label: 'Existing spend', get: s => (/(pay|budget|spend|retainer|tool)/i.test(s.existingAlternative + s.budgetOwnership) ? 4 : 2) },
  { key: 'access', label: 'Ease of access', get: s => s.accessibility },
  { key: 'buy', label: 'Ability to buy', get: s => (/own/i.test(s.budgetOwnership) ? 5 : /influence|recommend/i.test(s.budgetOwnership) ? 3 : 2) },
  { key: 'similar', label: 'Similarity', get: () => 3 },
  { key: 'evidence', label: 'Evidence', get: (s, ctx) => ctx.evidenceScore(s.id) },
]

interface Ctx { evidenceScore: (segId: string) => number }

export function Segments() {
  const { pid, segments, interviews, evidence } = useProjectData()
  const [open, setOpen] = useState(false)
  const [compare, setCompare] = useState<string[]>([])

  const ctx: Ctx = {
    evidenceScore: segId => {
      const segEvidence = evidence.filter(e => e.segmentId === segId)
      const s = scoreEvidence(segEvidence)
      return { strong: 5, mixed: 3, weak: 2, none: 1, contradicted: 1 }[s.strength]
    },
  }

  const rankOf = (s: CustomerSegment) => MATRIX_DIMS.reduce((a, d) => a + d.get(s, ctx), 0)
  const ranked = [...segments].sort((a, b) => rankOf(b) - rankOf(a))

  return (
    <div>
      <SectionHeading
        title="Customer Segments"
        sub="Prioritise by observable characteristics and buying behaviour, not fictional persona details."
        action={<button className="btn-primary" onClick={() => setOpen(true)}>+ New segment</button>}
      />

      {segments.length === 0 ? (
        <EmptyState title="No segments yet" body="Describe candidate groups by what they do, what triggers them, and who controls their budget." action={<button className="btn-primary" onClick={() => setOpen(true)}>Add a segment</button>} />
      ) : (
        <>
          {/* Prioritisation matrix */}
          <Card className="p-5 mb-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">ICP prioritisation matrix</h2>
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-ink-faint text-left border-b border-line">
                  <th className="font-medium py-2 pr-3">Segment</th>
                  {MATRIX_DIMS.map(d => <th key={d.key} className="font-medium py-2 px-1.5 text-center">{d.label}</th>)}
                  <th className="font-medium py-2 pl-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s, idx) => (
                  <tr key={s.id} className="border-b border-line/60">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Chip tone="support">Top</Chip>}
                        <span className="font-medium text-ink">{s.name}</span>
                      </div>
                      <span className="text-xs text-ink-faint">{interviews.filter(i => i.segmentId === s.id).length} interviews</span>
                    </td>
                    {MATRIX_DIMS.map(d => {
                      const v = d.get(s, ctx)
                      return <td key={d.key} className="py-2.5 px-1.5 text-center"><ScoreCell v={v} /></td>
                    })}
                    <td className="py-2.5 pl-3 text-right font-semibold">{rankOf(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-ink-faint mt-3">Scores are directional prompts to compare segments, not a verdict. Evidence strength is included so a well-liked-but-unproven segment doesn't rank above one with real signal.</p>
          </Card>

          {/* Cards + compare */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Segments</h2>
            {compare.length >= 2 && <button className="btn-outline" onClick={() => setCompare([])}>Clear comparison</button>}
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {segments.map(s => {
              const selected = compare.includes(s.id)
              return (
                <Card key={s.id} className={cn('p-4', selected && 'ring-2 ring-brand-500/40')}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink leading-snug">{s.name}</h3>
                    <button
                      className={cn('chip shrink-0', selected ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-black/[0.03] text-ink-soft border-line')}
                      onClick={() => setCompare(selected ? compare.filter(x => x !== s.id) : [...compare, s.id])}
                    >{selected ? '✓ Comparing' : 'Compare'}</button>
                  </div>
                  <p className="text-xs text-ink-faint mt-0.5">{s.role} · {s.companySize}</p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <Row k="Trigger" v={s.triggerEvent} />
                    <Row k="Alternative" v={s.existingAlternative} />
                    <Row k="Frequency" v={s.frequency} />
                    <Row k="Budget" v={s.budgetOwnership} />
                  </dl>
                  <div className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-ink-faint">Why care</span><p className="text-ink-soft">{s.whyCare}</p></div>
                    <div><span className="text-ink-faint">Why not</span><p className="text-ink-soft">{s.whyNotCare}</p></div>
                  </div>
                </Card>
              )
            })}
          </div>

          {compare.length >= 2 && <CompareTable segments={segments.filter(s => compare.includes(s.id))} />}
        </>
      )}

      {open && <NewSegmentModal projectId={pid!} onClose={() => setOpen(false)} />}
    </div>
  )
}

function ScoreCell({ v }: { v: number }) {
  const tone = v >= 4 ? 'bg-support-bg text-support-fg' : v <= 2 ? 'bg-contra-bg/60 text-contra-fg' : 'bg-unclear-bg text-unclear-fg'
  return <span className={cn('inline-block w-6 h-6 leading-6 rounded text-xs font-semibold', tone)}>{v}</span>
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-2"><dt className="text-ink-faint w-20 shrink-0">{k}</dt><dd className="text-ink-soft">{v || '-'}</dd></div>
}

function CompareTable({ segments }: { segments: CustomerSegment[] }) {
  const rows: { label: string; get: (s: CustomerSegment) => string }[] = [
    { label: 'Role', get: s => s.role },
    { label: 'Company size', get: s => s.companySize },
    { label: 'Workflow', get: s => s.workflow },
    { label: 'Trigger event', get: s => s.triggerEvent },
    { label: 'Existing alternative', get: s => s.existingAlternative },
    { label: 'Frequency', get: s => s.frequency },
    { label: 'Severity (1-5)', get: s => String(s.severity) },
    { label: 'Budget ownership', get: s => s.budgetOwnership },
    { label: 'Why they may care', get: s => s.whyCare },
    { label: 'Why they may not', get: s => s.whyNotCare },
  ]
  return (
    <Card className="p-5 mt-4 overflow-x-auto">
      <h2 className="font-semibold mb-3">Side-by-side comparison</h2>
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left font-medium text-ink-faint py-2 pr-4 w-40">Dimension</th>
            {segments.map(s => <th key={s.id} className="text-left font-semibold py-2 px-3">{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-b border-line/60 align-top">
              <td className="py-2 pr-4 text-ink-faint">{r.label}</td>
              {segments.map(s => <td key={s.id} className="py-2 px-3 text-ink-soft">{r.get(s)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function freqScore(f: string): number {
  const low = f.toLowerCase()
  if (/(daily|every day|constant|all the time)/.test(low)) return 5
  if (/week/.test(low)) return 4
  if (/month/.test(low)) return 3
  if (/quarter/.test(low)) return 2
  return 1
}

function NewSegmentModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const addSegment = useStore(s => s.addSegment)
  const [f, setF] = useState<Partial<CustomerSegment>>({ severity: 3, accessibility: 3 })
  const set = (k: keyof CustomerSegment, v: any) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <Modal open onClose={onClose} wide title="New customer segment" sub="Describe observable traits, not a fictional persona.">
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Segment name"><input className="input" onChange={e => set('name', e.target.value)} placeholder="High-volume DTC performance leads" /></Field>
          <Field label="Role / job title"><input className="input" onChange={e => set('role', e.target.value)} /></Field>
          <Field label="Industry"><input className="input" onChange={e => set('industry', e.target.value)} /></Field>
          <Field label="Company size"><input className="input" onChange={e => set('companySize', e.target.value)} /></Field>
          <Field label="Geography"><input className="input" onChange={e => set('geography', e.target.value)} /></Field>
          <Field label="Budget ownership"><input className="input" onChange={e => set('budgetOwnership', e.target.value)} placeholder="Owns / influences / none" /></Field>
        </div>
        <Field label="Relevant workflow"><textarea className="input min-h-[56px]" onChange={e => set('workflow', e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Trigger event"><input className="input" onChange={e => set('triggerEvent', e.target.value)} /></Field>
          <Field label="Existing alternative"><input className="input" onChange={e => set('existingAlternative', e.target.value)} /></Field>
          <Field label="Problem frequency"><input className="input" onChange={e => set('frequency', e.target.value)} placeholder="Weekly" /></Field>
          <Field label={`Severity: ${f.severity}/5`}><input type="range" min={1} max={5} value={f.severity} className="w-full" onChange={e => set('severity', Number(e.target.value))} /></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Why this segment may care"><textarea className="input min-h-[56px]" onChange={e => set('whyCare', e.target.value)} /></Field>
          <Field label="Why this segment may not care"><textarea className="input min-h-[56px]" onChange={e => set('whyNotCare', e.target.value)} /></Field>
        </div>
        <Callout tone="info">Accessibility and severity feed the prioritisation matrix. Be honest about "why they may not care", it protects you from wishful targeting.</Callout>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            addSegment({
              projectId, name: f.name || 'Untitled segment', industry: f.industry || '', role: f.role || '',
              companySize: f.companySize || '', geography: f.geography || '', workflow: f.workflow || '',
              triggerEvent: f.triggerEvent || '', existingAlternative: f.existingAlternative || '',
              frequency: f.frequency || '', severity: f.severity || 3, budgetOwnership: f.budgetOwnership || '',
              accessibility: f.accessibility || 3, whyCare: f.whyCare || '', whyNotCare: f.whyNotCare || '', hypothesisIds: [],
            })
            onClose()
          }}>Create segment</button>
        </div>
      </div>
    </Modal>
  )
}
