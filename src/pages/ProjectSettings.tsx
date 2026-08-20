import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, SectionHeading, Field, Callout } from '@/components/ui'
import { ConfidenceIndicator } from '@/components/widgets'
import { useActiveProject } from '@/store/hooks'
import { useStore } from '@/store/useStore'
import { WELCOME_KEY } from '@/store/ui'
import { ai } from '@/ai/engine'
import type { ProblemCritique } from '@/ai/schemas'
import type { Confidence } from '@/types/domain'

export function ProjectSettings() {
  const project = useActiveProject()
  const updateProject = useStore(s => s.updateProject)
  const addProject = useStore(s => s.addProject)
  const resetDemo = useStore(s => s.resetDemo)
  const startFresh = useStore(s => s.startFresh)
  const exportProject = useStore(s => s.exportProject)
  const importProject = useStore(s => s.importProject)
  const navigate = useNavigate()

  const [critique, setCritique] = useState<ProblemCritique | null>(null)
  const [busy, setBusy] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Editable draft. Changes stay local until "Save" commits them to the store,
  // so this reads like a settings form rather than saving on every keystroke.
  const [draft, setDraft] = useState(project)
  const [justSaved, setJustSaved] = useState(false)

  // Re-sync the draft when the active project changes (e.g. switched in the
  // sidebar) so edits always reflect the project currently in view.
  useEffect(() => {
    setDraft(project)
    setCritique(null)
    setJustSaved(false)
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!project || !draft) return null

  const set = (patch: Partial<typeof draft>) => {
    setDraft(d => (d ? { ...d, ...patch } : d))
    setJustSaved(false)
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(project)

  function handleSave() {
    if (!project || !draft) return
    updateProject(project.id, draft)
    setJustSaved(true)
  }

  // Create a blank project and drop the user straight into the empty form to
  // fill it out (same destination as first-run onboarding).
  function handleNewProject() {
    addProject({ name: '', problemStatement: '', solutionIdea: '', industry: '', stage: 'Idea / pre-seed', decisionToMake: '', deadline: '', confidence: 'low' })
    navigate('/settings')
    window.scrollTo({ top: 0 })
  }

  function handleExport() {
    const bundle = exportProject(project!.id)
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = project!.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project'
    a.href = url
    a.download = `groundwork-${slug}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const newId = importProject(parsed)
      if (!newId) throw new Error('Not a valid Groundwork export file.')
      setImportMsg({ ok: true, text: 'Imported as a new project and switched to it.' })
    } catch (e) {
      setImportMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not read that file.' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function checkProblem() {
    setBusy(true)
    setCritique(await ai.critiqueProblem(draft!.problemStatement))
    setBusy(false)
  }

  return (
    <div>
      <SectionHeading
        title="Project settings"
        sub="Separate the problem from your proposed solution. A problem describes who hurts and why, not what you plan to build."
        action={
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-ink-faint">Unsaved changes</span>}
            {!dirty && justSaved && <span className="text-xs text-support-fg">Saved</span>}
            <button className="btn-outline" onClick={handleNewProject}>+ New project</button>
            <button className="btn-primary" onClick={handleSave} disabled={!dirty}>Save changes</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <Field label="Startup / project name"><input className="input" value={draft.name} onChange={e => set({ name: e.target.value })} /></Field>

            <Field label="Problem statement" hint="Who experiences it, in what situation, and what does it cost them?">
              <textarea className="input min-h-[80px]" value={draft.problemStatement} onChange={e => { set({ problemStatement: e.target.value }); setCritique(null) }} />
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

            <Field label="Current solution idea (optional)" hint="Kept separate on purpose, you are validating the problem first.">
              <textarea className="input min-h-[60px]" value={draft.solutionIdea ?? ''} onChange={e => set({ solutionIdea: e.target.value })} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Industry"><input className="input" value={draft.industry} onChange={e => set({ industry: e.target.value })} /></Field>
              <Field label="Startup stage"><input className="input" value={draft.stage} onChange={e => set({ stage: e.target.value })} /></Field>
            </div>

            <Field label="What decision are you trying to make?"><textarea className="input min-h-[56px]" value={draft.decisionToMake} onChange={e => set({ decisionToMake: e.target.value })} /></Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Validation deadline"><input type="date" className="input" value={draft.deadline ?? ''} onChange={e => set({ deadline: e.target.value })} /></Field>
              <Field label="Current confidence">
                <select className="input" value={draft.confidence} onChange={e => set({ confidence: e.target.value as Confidence })}>
                  <option value="very_low">Very low</option><option value="low">Low</option>
                  <option value="medium">Medium</option><option value="high">High</option><option value="very_high">Very high</option>
                </select>
                <div className="mt-2"><ConfidenceIndicator confidence={draft.confidence} /></div>
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
            <h3 className="section-title mb-2">Your data</h3>
            <p className="text-sm text-ink-soft mb-3">Your work is saved in this browser. Export a project to back it up or move it to another device; import to bring it back.</p>
            <div className="flex flex-col gap-2">
              <button className="btn-outline w-full" onClick={handleExport}>↓ Export this project</button>
              <button className="btn-outline w-full" onClick={() => fileRef.current?.click()}>↑ Import a project file</button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }} />
            </div>
            {importMsg && (
              <p className={`text-xs mt-2 ${importMsg.ok ? 'text-support-fg' : 'text-contra-fg'}`}>{importMsg.text}</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="section-title mb-2">Start over</h3>
            <div className="flex flex-col gap-2">
              <button
                className="btn-outline w-full"
                onClick={() => { if (confirm('Clear all local data and start with a blank project?')) { startFresh(); navigate('/') } }}
              >Start a fresh workspace</button>
              <button
                className="btn-outline w-full"
                onClick={() => { try { localStorage.removeItem(WELCOME_KEY) } catch { /* ignore */ } location.reload() }}
              >Replay the welcome walkthrough</button>
              <button
                className="btn-ghost w-full text-ink-faint"
                onClick={() => { if (confirm('Reset all local data to the demo?')) resetDemo() }}
              >Reset to demo data</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
