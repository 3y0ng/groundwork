// Convenience selectors scoped to the active project.
import { useStore } from './useStore'

export function useActiveProject() {
  return useStore(s => s.projects.find(p => p.id === s.activeProjectId) ?? s.projects[0])
}

export function useProjectData() {
  const pid = useStore(s => s.activeProjectId ?? s.projects[0]?.id)
  const hypotheses = useStore(s => s.hypotheses.filter(h => h.projectId === pid))
  const segments = useStore(s => s.segments.filter(x => x.projectId === pid))
  const interviews = useStore(s => s.interviews.filter(x => x.projectId === pid))
  const evidence = useStore(s => s.evidence.filter(x => x.projectId === pid))
  const decisions = useStore(s => s.decisions.filter(x => x.projectId === pid))
  const insights = useStore(s => s.insights.filter(x => x.projectId === pid))
  return { pid, hypotheses, segments, interviews, evidence, decisions, insights }
}
