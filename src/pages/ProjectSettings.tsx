import { useState } from 'react'
import { Card, SectionHeading, Field, Callout } from '@/components/ui'
import { ConfidenceIndicator } from '@/components/widgets'
import { useActiveProject } from '@/store/hooks'
import { useStore } from '@/store/useStore'
import { ai } from '@/ai/engine'
import type { ProblemCritique } from '@/ai/schemas'
import type { Confidence } from '@/types/domain'

export function ProjectSettings() {
  const project = useActiveProject()
  const updateProject = useStore(s => s.updateProject)
  const addProject = useStore(s => s.addProject)
  const resetDemo = useStore(s => s.resetDemo)

  const [critique, setCritique] = useState<ProblemCritique | null>(null)
  const [busy, setBusy] = useState(false)

  if (!project) return null
  const set = (patch: Partial<typeof project>) => updateProject(project.id, patch)

  async function checkProblem() {
    setBusy(true)
    setCritique(await ai.critiqueProblem(project!.problemStatement))
    setBusy(false)
  }

  return (
    <div>
      <SectionHeading
        title="Project setup"
        sub="Separate the problem from your proposed solution. A problem describes who hurts and why — not what you plan to build."
        action={
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => { const id = addProject({ name: 'New project', problemStatement: '', solutionIdea: '', industry: '', stage: 'Idea / pre-seed', decisionToMake: '', deadline: '', confidence: 'low' }); void id }}>+ New project</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <Field label="Startup / project name"><input className="input" value={project.name} onChange={e => set({ name: e.target.value })} /></Field>

            <Field label="Problem statement" hint="Who experiences it, in what situation, and what does it cost them?">
              <textarea className="input min-h-[80px]" value={project.problemStatement} onChange={e => { set({ problemStatement: e.target.value }); setCritique(null) }} />
            </Field>
            <button className="btn-outline" onClick={checkProblem} disabled={busy}>{busy ? 'Checking…' : 'Check problem statement'}</button>
            {critique && (
              critique.looksLikeSolution
                ? <Callout tone="warn" title="This reads like a solution, not a problem">
                    {critique.reasoning}
                    {critique.suggestedRewrite && <p className="mt-2 text-ink"><span className="font-semibold">Try this shape:</span> {critique.suggestedRewrite}</p>}
                  </Callout>
                : <Callout tone="good" title="Problem-shaped">{critique.reasoning}</Callout>
            )}

            <Field label="Current solution idea (optional)" hint="Kept separate on purpose — you are validating the problem first.">
              <textarea className="input min-h-[60px]" value={project.solutionIdea ?? ''} onChange={e => set({ solutionIdea: e.target.value })} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Industry"><input className="input" value={project.industry} onChange={e => set({ industry: e.target.value })} /></Field>
              <Field label="Startup stage"><input className="input" value={project.stage} onChange={e => set({ stage: e.target.value })} /></Field>
            </div>

            <Field label="What decision are you trying to make?"><textarea className="input min-h-[56px]" value={project.decisionToMake} onChange={e => set({ decisionToMake: e.target.value })} /></Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Validation deadline"><input type="date" className="input" value={project.deadline ?? ''} onChange={e => set({ deadline: e.target.value })} /></Field>
              <Field label="Current confidence">
                <select className="input" value={project.confidence} onChange={e => set({ confidence: e.target.value as Confidence })}>
                  <option value="very_low">Very low</option><option value="low">Low</option>
                  <option value="medium">Medium</option><option value="high">High</option><option value="very_high">Very high</option>
                </select>
                <div className="mt-2"><ConfidenceIndicator confidence={project.confidence} /></div>
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="section-title mb-2">Weak vs. better</h3>
            <div className="rounded-lg border border-contra-line bg-contra-bg p-3 text-sm mb-2">
              <p className="text-xs font-semibold text-contra-fg mb-1">WEAK</p>
              <p className="text-ink-soft">"Small businesses need an AI analytics dashboard."</p>
            </div>
            <div className="rounded-lg border border-support-line bg-support-bg p-3 text-sm">
              <p className="text-xs font-semibold text-support-fg mb-1">BETTER</p>
              <p className="text-ink-soft">"Small marketing teams struggle to understand why individual ad creatives perform differently, so they repeat poor decisions and waste budget."</p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="section-title mb-2">Reset</h3>
            <p className="text-sm text-ink-soft mb-3">Restore the demo project and sample interviews. Clears anything you've added locally.</p>
            <button className="btn-outline w-full" onClick={() => { if (confirm('Reset all local data to the demo?')) resetDemo() }}>Reset demo data</button>
          </Card>
        </div>
      </div>
    </div>
  )
}
