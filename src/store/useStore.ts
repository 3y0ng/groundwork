// ---------------------------------------------------------------------------
// Application store. Persists to localStorage so the demo survives refreshes.
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

  resetDemo: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seedBundle,
      evidence: [],
      templates: [],
      activeProjectId: seedBundle.projects[0]?.id ?? null,

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

      resetDemo: () =>
        set({ ...seedBundle, evidence: [], templates: [], activeProjectId: seedBundle.projects[0]?.id ?? null }),
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
