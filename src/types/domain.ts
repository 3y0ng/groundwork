// ---------------------------------------------------------------------------
// Groundwork domain model
// One place for every entity the validation workflow revolves around.
// Mirrors the Supabase schema in /supabase/schema.sql.
// ---------------------------------------------------------------------------

export type ID = string

// --- Shared vocabularies -------------------------------------------------

export type HypothesisType =
  | 'problem_exists'
  | 'problem_frequent'
  | 'problem_urgent'
  | 'solutions_inadequate'
  | 'has_budget'
  | 'actively_searching'
  | 'reachable'
  | 'buyer_user_identifiable'
  | 'value_prop_compelling'
  | 'will_commit'

export const HYPOTHESIS_TYPES: { value: HypothesisType; label: string; help: string }[] = [
  { value: 'problem_exists', label: 'Problem exists', help: 'A real group actually experiences this.' },
  { value: 'problem_frequent', label: 'Problem is frequent', help: 'It recurs often enough to matter.' },
  { value: 'problem_urgent', label: 'Problem is urgent', help: 'There are real consequences to leaving it unsolved.' },
  { value: 'solutions_inadequate', label: 'Existing solutions are inadequate', help: 'Current workarounds fall short.' },
  { value: 'has_budget', label: 'Customer has budget', help: 'They can and do spend money on this area.' },
  { value: 'actively_searching', label: 'Customer is actively searching', help: 'They are already looking for a fix.' },
  { value: 'reachable', label: 'Customer can be reached', help: 'You have a repeatable way to find them.' },
  { value: 'buyer_user_identifiable', label: 'Buyer & user are identifiable', help: 'You know who uses it and who pays.' },
  { value: 'value_prop_compelling', label: 'Value proposition is compelling', help: 'Your framing resonates against reality.' },
  { value: 'will_commit', label: 'Customer will commit', help: 'They give time, money, or reputation.' },
]

// Evidence strength is NOT derived from interview count alone.
export type EvidenceStrength =
  | 'none'
  | 'weak'
  | 'mixed'
  | 'strong'
  | 'contradicted'

export const EVIDENCE_STRENGTH: Record<EvidenceStrength, { label: string; rank: number }> = {
  none: { label: 'No evidence', rank: 0 },
  weak: { label: 'Weak signals', rank: 1 },
  mixed: { label: 'Mixed evidence', rank: 2 },
  strong: { label: 'Strong evidence', rank: 3 },
  contradicted: { label: 'Contradicted', rank: -1 },
}

export type HypothesisStatus =
  | 'untested'
  | 'testing'
  | 'supported'
  | 'partially_supported'
  | 'inconclusive'
  | 'contradicted'

export type Confidence = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

export const CONFIDENCE: Record<Confidence, { label: string; pct: number }> = {
  very_low: { label: 'Very low', pct: 10 },
  low: { label: 'Low', pct: 30 },
  medium: { label: 'Medium', pct: 50 },
  high: { label: 'High', pct: 70 },
  very_high: { label: 'Very high', pct: 90 },
}

// How a piece of evidence should be weighted. Order matters: behaviour and
// commitment outrank opinion and compliments.
export type EvidenceKind =
  | 'observed_past_behaviour'
  | 'current_behaviour'
  | 'existing_commitment'
  | 'new_commitment'
  | 'stated_opinion'
  | 'hypothetical'
  | 'compliment'
  | 'contradiction'

export const EVIDENCE_KIND: Record<
  EvidenceKind,
  { label: string; weight: number; note: string; tone: 'strong' | 'medium' | 'weak' | 'contra' }
> = {
  observed_past_behaviour: { label: 'Past behaviour', weight: 5, tone: 'strong', note: 'Something they actually did.' },
  existing_commitment: { label: 'Existing commitment', weight: 5, tone: 'strong', note: 'Money, time, or reputation already spent.' },
  new_commitment: { label: 'New commitment', weight: 4, tone: 'strong', note: 'A concrete next step they agreed to.' },
  current_behaviour: { label: 'Current behaviour', weight: 4, tone: 'medium', note: 'How they handle it today.' },
  stated_opinion: { label: 'Stated opinion', weight: 2, tone: 'weak', note: 'What they say they think.' },
  hypothetical: { label: 'Hypothetical claim', weight: 1, tone: 'weak', note: 'What they imagine they might do.' },
  compliment: { label: 'Compliment', weight: 0, tone: 'weak', note: 'Encouragement, not evidence.' },
  contradiction: { label: 'Contradiction', weight: -3, tone: 'contra', note: 'Cuts against the hypothesis.' },
}

export type EvidenceDirection = 'supports' | 'contradicts' | 'unclear'

export type NoteTag =
  | 'problem' | 'trigger' | 'workflow' | 'pain' | 'consequence' | 'frequency'
  | 'urgency' | 'existing_solution' | 'spending' | 'workaround' | 'objection'
  | 'quote' | 'commitment' | 'contradiction' | 'assumption' | 'follow_up'

export const NOTE_TAGS: NoteTag[] = [
  'problem', 'trigger', 'workflow', 'pain', 'consequence', 'frequency',
  'urgency', 'existing_solution', 'spending', 'workaround', 'objection',
  'quote', 'commitment', 'contradiction', 'assumption', 'follow_up',
]

export type DecisionType =
  | 'continue_testing'
  | 'narrow_segment'
  | 'refine_hypothesis'
  | 'test_related'
  | 'proceed_to_solution'
  | 'pause'
  | 'reject'
  | 'pivot'

export const DECISION_TYPES: { value: DecisionType; label: string }[] = [
  { value: 'continue_testing', label: 'Continue testing' },
  { value: 'narrow_segment', label: 'Narrow the segment' },
  { value: 'refine_hypothesis', label: 'Refine the hypothesis' },
  { value: 'test_related', label: 'Test a related hypothesis' },
  { value: 'proceed_to_solution', label: 'Proceed to solution testing' },
  { value: 'pause', label: 'Pause' },
  { value: 'reject', label: 'Reject' },
  { value: 'pivot', label: 'Pivot' },
]

// --- Entities ------------------------------------------------------------

export interface Project {
  id: ID
  name: string
  problemStatement: string
  solutionIdea?: string
  industry: string
  stage: string
  decisionToMake: string
  deadline?: string
  confidence: Confidence
  createdAt: string
}

export interface Hypothesis {
  id: ID
  projectId: ID
  title: string
  type: HypothesisType
  belief: string // sentence-builder output
  segmentIds: ID[]
  assumptions: string[]
  evidenceRequired: string
  disconfirming: string // what would prove it wrong
  supportThreshold: number // # of relevant conversations to consider supported
  confidence: Confidence
  status: HypothesisStatus
  strength: EvidenceStrength
  createdAt: string
}

export interface CustomerSegment {
  id: ID
  projectId: ID
  name: string
  industry: string
  role: string
  companySize: string
  geography: string
  workflow: string
  triggerEvent: string
  existingAlternative: string
  frequency: string
  severity: number // 1-5
  budgetOwnership: string
  accessibility: number // 1-5
  whyCare: string
  whyNotCare: string
  hypothesisIds: ID[]
}

export interface InterviewQuestion {
  id: ID
  section: QuestionSection
  text: string
  rationale?: string
}

export type QuestionSection =
  | 'context'
  | 'recent_occurrence'
  | 'current_workflow'
  | 'severity_consequences'
  | 'existing_alternatives'
  | 'previous_attempts'
  | 'spending_resources'
  | 'decision_making'
  | 'commitment'

export const QUESTION_SECTIONS: { value: QuestionSection; label: string }[] = [
  { value: 'context', label: 'Context' },
  { value: 'recent_occurrence', label: 'Most recent occurrence' },
  { value: 'current_workflow', label: 'Current workflow' },
  { value: 'severity_consequences', label: 'Severity & consequences' },
  { value: 'existing_alternatives', label: 'Existing alternatives' },
  { value: 'previous_attempts', label: 'Previous attempts' },
  { value: 'spending_resources', label: 'Spending & resources' },
  { value: 'decision_making', label: 'Decision-making' },
  { value: 'commitment', label: 'Commitment / next step' },
]

export interface InterviewTemplate {
  id: ID
  projectId: ID
  name: string
  questions: InterviewQuestion[]
}

export interface Interview {
  id: ID
  projectId: ID
  participantName: string
  company: string
  role: string
  segmentId?: ID
  date: string
  interviewer: string
  hypothesisIds: ID[]
  rawNotes: string
  transcript?: string
  // Structured capture
  keyQuotes: string[]
  currentWorkflow: string
  triggerEvents: string
  painPoints: string
  consequences: string
  existingTools: string
  existingSpend: string
  workarounds: string
  frequency: string
  severity: string
  decisionProcess: string
  commitments: string
  followUps: string
  createdAt: string
}

export interface EvidenceItem {
  id: ID
  projectId: ID
  interviewId: ID
  statement: string // original, factual
  quote: string // exact supporting quote from notes (never invented)
  kind: EvidenceKind
  direction: EvidenceDirection
  hypothesisIds: ID[]
  segmentId?: ID
  strength: EvidenceStrength
  founderInterpretation: string // kept separate from AI interpretation
  aiInterpretation: string
  tags: NoteTag[]
  createdAt: string
}

export interface Decision {
  id: ID
  projectId: ID
  hypothesisId: ID
  decision: DecisionType
  evidenceBasis: string
  remainingUncertainty: string
  nextTest: string
  wouldChangeMind: string
  createdAt: string
}

// Insight can attach at any level of the workflow.
export interface Insight {
  id: ID
  projectId: ID
  level: 'interview' | 'segment' | 'hypothesis' | 'project'
  refId?: ID
  title: string
  body: string
  createdAt: string
}
