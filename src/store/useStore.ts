// ---------------------------------------------------------------------------
// Application store. Persists to localStorage so your work survives refreshes.
// When Supabase is configured this is the layer you would swap for queries;
// the shapes already match /supabase/schema.sql.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, nowISO } from '@/lib/utils'
import { seedBundle } from './seed'
import {
  EVIDENCE_KIND, EVIDENCE_STRENGTH,
  type Project, type Hypothesis, type CustomerSegment, type Interview,
  type EvidenceItem, type Decision, type Insight, type InterviewTemplate,
  type EvidenceStrength,
} from '@/types/domain'

// A self-contained, portable bundle for one project. Because the hosted tool
// is account-free, this is how a founder backs up or moves their work.
export interface GroundworkBundle {
  version: 1
  exportedAt: string
  project: Project
  hypotheses: Hypothesis[]
  segments: CustomerSegment[]
  interviews: Interview[]
  evidence: EvidenceItem[]
  decisions: Decision[]
  insights: Insight[]
}

interface State {
  projects: Project[]
  hypotheses: Hypothesis[]
  segments: CustomerSegment[]
  interviews: Interview[]
  evidence: EvidenceItem[]
  decisions: Decision[]
  insights: Insight[]
  templates: InterviewTemplate[]
  activeProjectId: string | null

  // project
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => string
  updateProject: (id: string, patch: Partial<Project>) => void
  setActiveProject: (id: string) => void

  // hypotheses
  addHypothesis: (h: Omit<Hypothesis, 'id' | 'createdAt'>) => string
  updateHypothesis: (id: string, patch: Partial<Hypothesis>) => void
  removeHypothesis: (id: string) => void

  // segments
  addSegment: (s: Omit<CustomerSegment, 'id'>) => string
  updateSegment: (id: string, patch: Partial<CustomerSegment>) => void
  removeSegment: (id: string) => void

  // interviews
  addInterview: (i: Omit<Interview, 'id' | 'createdAt'>) => string
  updateInterview: (id: string, patch: Partial<Interview>) => void
  removeInterview: (id: string) => void

  // evidence
  addEvidence: (e: Omit<EvidenceItem, 'id' | 'createdAt'>) => string
  updateEvidence: (id: string, patch: Partial<EvidenceItem>) => void
  removeEvidence: (id: string) => void

  // decisions
  saveDecision: (d: Omit<Decision, 'id' | 'createdAt'>) => string

  // insights
  addInsight: (i: Omit<Insight, 'id' | 'createdAt'>) => string
  removeInsight: (id: string) => void

  // templates
  addTemplate: (t: Omit<InterviewTemplate, 'id'>) => string

  // portability
  exportProject: (projectId: string) => GroundworkBundle
  importProject: (bundle: unknown) => string | null

  resetDemo: () => void
  startFresh: () => string
}

// One empty project: the "brand-new founder" starting state. This is the
// default the app boots into, so the demo never auto-loads, it appears only
// when explicitly requested (welcome modal's "Explore the demo" or the
// "Reset to demo" button in Project setup). Shared with startFresh().
function blankBundle() {
  const id = uid('proj')
  const project: Project = {
    id, name: '', problemStatement: '', solutionIdea: '', industry: '',
    stage: 'Idea / pre-seed', decisionToMake: '', deadline: '', confidence: 'low',
    createdAt: nowISO(),
  }
  return {
    projects: [project], hypotheses: [], segments: [], interviews: [],
    evidence: [], decisions: [], insights: [], templates: [], activeProjectId: id,
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...blankBundle(),

      addProject: p => {
        const id = uid('proj')
        set(s => ({ projects: [...s.projects, { ...p, id, createdAt: nowISO() }], activeProjectId: id }))
        return id
      },
      updateProject: (id, patch) => set(s => ({ projects: s.projects.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
      setActiveProject: id => set({ activeProjectId: id }),

      addHypothesis: h => {
        const id = uid('hyp')
        set(s => ({ hypotheses: [...s.hypotheses, { ...h, id, createdAt: nowISO() }] }))
        return id
      },
      updateHypothesis: (id, patch) => set(s => ({ hypotheses: s.hypotheses.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
      removeHypothesis: id => set(s => ({ hypotheses: s.hypotheses.filter(x => x.id !== id) })),

      addSegment: seg => {
        const id = uid('seg')
        set(s => ({ segments: [...s.segments, { ...seg, id }] }))
        return id
      },
      updateSegment: (id, patch) => set(s => ({ segments: s.segments.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSegment: id => set(s => ({ segments: s.segments.filter(x => x.id !== id) })),

      addInterview: i => {
        const id = uid('int')
        set(s => ({ interviews: [...s.interviews, { ...i, id, createdAt: nowISO() }] }))
        return id
      },
      updateInterview: (id, patch) => set(s => ({ interviews: s.interviews.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
      removeInterview: id =>
        set(s => ({
          interviews: s.interviews.filter(x => x.id !== id),
          evidence: s.evidence.filter(e => e.interviewId !== id),
        })),

      addEvidence: e => {
        const id = uid('ev')
        set(s => ({ evidence: [...s.evidence, { ...e, id, createdAt: nowISO() }] }))
        return id
      },
      updateEvidence: (id, patch) => set(s => ({ evidence: s.evidence.map(x => (x.id === id ? { ...x, ...patch } : x)) })),
      removeEvidence: id => set(s => ({ evidence: s.evidence.filter(x => x.id !== id) })),

      saveDecision: d => {
        const id = uid('dec')
        set(s => ({ decisions: [{ ...d, id, createdAt: nowISO() }, ...s.decisions] }))
        return id
      },

      addInsight: i => {
        const id = uid('ins')
        set(s => ({ insights: [{ ...i, id, createdAt: nowISO() }, ...s.insights] }))
        return id
      },
      removeInsight: id => set(s => ({ insights: s.insights.filter(x => x.id !== id) })),

      addTemplate: t => {
        const id = uid('tpl')
        set(s => ({ templates: [...s.templates, { ...t, id }] }))
        return id
      },

      exportProject: projectId => {
        const s = get()
        return {
          version: 1,
          exportedAt: nowISO(),
          project: s.projects.find(p => p.id === projectId)!,
          hypotheses: s.hypotheses.filter(h => h.projectId === projectId),
          segments: s.segments.filter(x => x.projectId === projectId),
          interviews: s.interviews.filter(x => x.projectId === projectId),
          evidence: s.evidence.filter(x => x.projectId === projectId),
          decisions: s.decisions.filter(x => x.projectId === projectId),
          insights: s.insights.filter(x => x.projectId === projectId),
        }
      },

      importProject: bundle => {
        const b = bundle as Partial<GroundworkBundle>
        if (!b || !b.project || !Array.isArray(b.hypotheses)) return null

        // Regenerate every id so an import never collides with existing data,
        // then rewrite all cross-references through the same map.
        const map = new Map<string, string>()
        const idFor = (old: string, prefix: string) => {
          if (!map.has(old)) map.set(old, uid(prefix))
          return map.get(old)!
        }
        const remap = (id?: string) => (id ? map.get(id) ?? id : id)

        const newProjectId = idFor(b.project.id, 'proj')
        ;(b.hypotheses ?? []).forEach(h => idFor(h.id, 'hyp'))
        ;(b.segments ?? []).forEach(x => idFor(x.id, 'seg'))
        ;(b.interviews ?? []).forEach(x => idFor(x.id, 'int'))
        ;(b.evidence ?? []).forEach(x => idFor(x.id, 'ev'))
        ;(b.decisions ?? []).forEach(x => idFor(x.id, 'dec'))
        ;(b.insights ?? []).forEach(x => idFor(x.id, 'ins'))

        const project: Project = { ...b.project, id: newProjectId, name: `${b.project.name} (imported)`, createdAt: nowISO() }
        const hypotheses = (b.hypotheses ?? []).map(h => ({ ...h, id: remap(h.id)!, projectId: newProjectId, segmentIds: (h.segmentIds ?? []).map(x => remap(x)!) }))
        const segments = (b.segments ?? []).map(x => ({ ...x, id: remap(x.id)!, projectId: newProjectId, hypothesisIds: (x.hypothesisIds ?? []).map(h => remap(h)!) }))
        const interviews = (b.interviews ?? []).map(x => ({ ...x, id: remap(x.id)!, projectId: newProjectId, segmentId: remap(x.segmentId), hypothesisIds: (x.hypothesisIds ?? []).map(h => remap(h)!) }))
        const evidence = (b.evidence ?? []).map(x => ({ ...x, id: remap(x.id)!, projectId: newProjectId, interviewId: remap(x.interviewId)!, segmentId: remap(x.segmentId), hypothesisIds: (x.hypothesisIds ?? []).map(h => remap(h)!) }))
        const decisions = (b.decisions ?? []).map(x => ({ ...x, id: remap(x.id)!, projectId: newProjectId, hypothesisId: remap(x.hypothesisId)! }))
        const insights = (b.insights ?? []).map(x => ({ ...x, id: remap(x.id)!, projectId: newProjectId, refId: remap(x.refId) }))

        set(s => ({
          projects: [...s.projects, project],
          hypotheses: [...s.hypotheses, ...hypotheses],
          segments: [...s.segments, ...segments],
          interviews: [...s.interviews, ...interviews],
          evidence: [...s.evidence, ...evidence],
          decisions: [...s.decisions, ...decisions],
          insights: [...s.insights, ...insights],
          activeProjectId: newProjectId,
        }))
        return newProjectId
      },

      resetDemo: () =>
        set({ ...seedBundle, evidence: [], templates: [], activeProjectId: seedBundle.projects[0]?.id ?? null }),

      // Clear everything and start with one blank project, the true "brand-new
      // founder" state. Always leaves ≥1 project so page guards hold.
      startFresh: () => {
        const bundle = blankBundle()
        set(bundle)
        return bundle.activeProjectId
      },
    }),
    {
      name: 'groundwork-store-v1',
      // Only persist data, not the action functions.
      partialize: s => ({
        projects: s.projects, hypotheses: s.hypotheses, segments: s.segments,
        interviews: s.interviews, evidence: s.evidence, decisions: s.decisions,
        insights: s.insights, templates: s.templates, activeProjectId: s.activeProjectId,
      }),
    },
  ),
)

// ---------------------------------------------------------------------------
// Derived selectors (pure helpers, not hooks) so pages share one definition
// of "how strong is the evidence".
// ---------------------------------------------------------------------------

export function evidenceForHypothesis(hypId: string, all: EvidenceItem[]) {
  return all.filter(e => e.hypothesisIds.includes(hypId))
}

// Quality-weighted score. Behaviour and commitment count for far more than
// opinion; compliments count for nothing; contradictions subtract. This is
// what keeps interview *count* from masquerading as evidence *strength*.
export function scoreEvidence(items: EvidenceItem[]): {
  strength: EvidenceStrength
  supportWeight: number
  contraWeight: number
  behaviourItems: number
  total: number
} {
  let supportWeight = 0
  let contraWeight = 0
  let behaviourItems = 0
  for (const e of items) {
    const w = EVIDENCE_KIND[e.kind].weight
    if (e.direction === 'contradicts' || w < 0) contraWeight += Math.abs(w) || 3
    else if (e.direction === 'supports') supportWeight += w
    if (e.kind === 'observed_past_behaviour' || e.kind === 'current_behaviour' || e.kind === 'existing_commitment' || e.kind === 'new_commitment')
      behaviourItems++
  }

  let strength: EvidenceStrength = 'none'
  if (items.length === 0) strength = 'none'
  else if (contraWeight > supportWeight && contraWeight >= 3) strength = 'contradicted'
  else if (supportWeight >= 12 && behaviourItems >= 3) strength = 'strong'
  else if (supportWeight >= 5 && (behaviourItems >= 1 || contraWeight > 0)) strength = 'mixed'
  else if (supportWeight > 0) strength = 'weak'

  return { strength, supportWeight, contraWeight, behaviourItems, total: items.length }
}

export { EVIDENCE_STRENGTH }
