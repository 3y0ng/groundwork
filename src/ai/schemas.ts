// ---------------------------------------------------------------------------
// Validated JSON schemas for every structured AI response.
// The mock engine and any future live LLM must both conform to these.
// Using zod means a malformed model response fails loudly instead of
// silently corrupting the evidence record.
// ---------------------------------------------------------------------------

import { z } from 'zod'

export const evidenceKindEnum = z.enum([
  'observed_past_behaviour',
  'current_behaviour',
  'existing_commitment',
  'new_commitment',
  'stated_opinion',
  'hypothetical',
  'compliment',
  'contradiction',
])

export const directionEnum = z.enum(['supports', 'contradicts', 'unclear'])

// --- Problem statement critique -----------------------------------------
export const ProblemCritiqueSchema = z.object({
  looksLikeSolution: z.boolean(),
  reasoning: z.string(),
  suggestedRewrite: z.string().optional(),
})
export type ProblemCritique = z.infer<typeof ProblemCritiqueSchema>

// --- Hypothesis rewrite --------------------------------------------------
export const HypothesisRewriteSchema = z.object({
  isTestable: z.boolean(),
  issues: z.array(z.string()),
  rewrite: z.string(),
  suggestedDisconfirming: z.string(),
})
export type HypothesisRewrite = z.infer<typeof HypothesisRewriteSchema>

// --- Interview guide generation -----------------------------------------
export const GuideQuestionSchema = z.object({
  section: z.string(),
  text: z.string(),
  rationale: z.string().optional(),
})
export const InterviewGuideSchema = z.object({
  questions: z.array(GuideQuestionSchema),
})
export type InterviewGuide = z.infer<typeof InterviewGuideSchema>

// --- Question quality review --------------------------------------------
export const QuestionReviewSchema = z.object({
  verdict: z.enum(['strong', 'weak']),
  problem: z.string().nullable(),
  reason: z.string().nullable(),
  replacement: z.string().nullable(),
})
export type QuestionReview = z.infer<typeof QuestionReviewSchema>

// --- Evidence extraction from notes -------------------------------------
export const ExtractedEvidenceSchema = z.object({
  statement: z.string(),
  quote: z.string(), // must be verbatim from the notes
  kind: evidenceKindEnum,
  direction: directionEnum,
  aiInterpretation: z.string(),
  tags: z.array(z.string()),
})
export const EvidenceExtractionSchema = z.object({
  items: z.array(ExtractedEvidenceSchema),
})
export type EvidenceExtraction = z.infer<typeof EvidenceExtractionSchema>

// --- Interview quality feedback -----------------------------------------
export const QualityDimensionSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().min(0).max(5),
  whatHappened: z.string(),
  whyItMatters: z.string(),
  betterQuestion: z.string().nullable(),
})
export const MissedFollowUpSchema = z.object({
  statement: z.string(),
  suggestedFollowUps: z.array(z.string()),
})
export const InterviewFeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  talkRatio: z
    .object({ interviewerPct: z.number(), customerPct: z.number(), note: z.string() })
    .nullable(),
  dimensions: z.array(QualityDimensionSchema),
  missedFollowUps: z.array(MissedFollowUpSchema),
  summary: z.object({
    strongestEvidence: z.string(),
    weakestEvidence: z.string(),
    surprisingInsight: z.string(),
    contradiction: z.string(),
    openQuestion: z.string(),
    recommendedNextQuestion: z.string(),
    hypothesesAffected: z.array(z.string()),
  }),
})
export type InterviewFeedback = z.infer<typeof InterviewFeedbackSchema>

// --- Consolidated hypothesis conclusion ---------------------------------
export const ConsolidationSchema = z.object({
  conclusion: z.enum(['supported', 'partially_supported', 'inconclusive', 'contradicted']),
  reasoning: z.string(),
  relevantConversations: z.number(),
  matchingSegments: z.number(),
  supporting: z.array(z.string()),
  contradicting: z.array(z.string()),
  unclear: z.array(z.string()),
  patterns: z.array(z.string()),
  outliers: z.array(z.string()),
  commonTriggers: z.array(z.string()),
  commonWorkflows: z.array(z.string()),
  commonConsequences: z.array(z.string()),
  existingAlternatives: z.array(z.string()),
  existingSpending: z.array(z.string()),
  commitmentStrength: z.string(),
  unansweredQuestions: z.array(z.string()),
  recommendedStrength: z.enum(['none', 'weak', 'mixed', 'strong', 'contradicted']),
})
export type Consolidation = z.infer<typeof ConsolidationSchema>

// --- Decision recommendation --------------------------------------------
export const DecisionRecommendationSchema = z.object({
  recommended: z.enum([
    'continue_testing', 'narrow_segment', 'refine_hypothesis', 'test_related',
    'proceed_to_solution', 'pause', 'reject', 'pivot',
  ]),
  reasoning: z.string(),
  remainingUncertainty: z.string(),
  suggestedNextTest: z.string(),
})
export type DecisionRecommendation = z.infer<typeof DecisionRecommendationSchema>

// --- Segment suggestions -------------------------------------------------
export const SegmentSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({ name: z.string(), rationale: z.string(), observableTraits: z.array(z.string()) }),
  ),
})
export type SegmentSuggestion = z.infer<typeof SegmentSuggestionSchema>
