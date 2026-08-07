// ---------------------------------------------------------------------------
// AI engine facade.
// Exposes one typed API used across the app. Default implementation is a
// heuristic mock that reads the actual note text (no network, no key). To go
// live, implement `callLLM` against your proxy using PROMPT + the zod schemas
// and flip VITE_AI_PROVIDER=anthropic.
// ---------------------------------------------------------------------------

import {
  ProblemCritiqueSchema, HypothesisRewriteSchema, InterviewGuideSchema,
  QuestionReviewSchema, EvidenceExtractionSchema, InterviewFeedbackSchema,
  ConsolidationSchema, DecisionRecommendationSchema, SegmentSuggestionSchema,
  type ProblemCritique, type HypothesisRewrite, type InterviewGuide,
  type QuestionReview, type EvidenceExtraction, type InterviewFeedback,
  type Consolidation, type DecisionRecommendation, type SegmentSuggestion,
} from './schemas'
import { PROMPT } from './prompts'

const PROVIDER = import.meta.env.VITE_AI_PROVIDER ?? 'mock'

export const aiProviderLabel = PROVIDER === 'mock' ? 'Mock engine' : String(PROVIDER)
export const isMockAI = PROVIDER === 'mock'

// Small helpers -------------------------------------------------------------
const sentences = (t: string) =>
  t.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)

const has = (t: string, words: string[]) => {
  const low = t.toLowerCase()
  return words.some(w => low.includes(w))
}

const clamp = (n: number, lo = 0, hi = 5) => Math.max(lo, Math.min(hi, n))

// Signal vocabularies used by the heuristics -------------------------------
const PAST_MARKERS = ['last time', 'yesterday', 'last week', 'last month', 'we did', 'i did', 'we built', 'we tried', 'ended up', 'we started', 'went with', 'we switched', 'happened when', 'so we', 'we ran']
const CURRENT_MARKERS = ['currently', 'right now', 'these days', 'we use', 'every week', 'each morning', 'we keep', 'we maintain', 'today we', 'at the moment']
const SPEND_MARKERS = ['$', 'paid', 'pay ', 'budget', 'subscription', 'license', 'per month', 'per seat', 'cost us', 'spend', 'spent', 'expensive']
const COMMIT_MARKERS = ['happy to', "let's set", 'set up a', 'send it over', 'introduce you', 'next week we', 'pilot', 'try it with', 'sign', 'i can commit', 'follow up', 'put you in touch']
const HYPOTHETICAL_MARKERS = ['would love', 'i would', "i'd probably", 'i guess i would', 'sounds useful', 'sounds great', 'i think i would', 'might use']
const COMPLIMENT_MARKERS = ['great idea', 'cool idea', 'love this', 'awesome', 'nice idea', 'sounds cool', 'you should build', 'interesting idea']
const CONSEQUENCE_MARKERS = ['cost us', 'lost', 'wasted', 'missed', 'because of that', 'as a result', 'meant we', 'ended up losing', 'burned', 'hurt']
const FREQUENCY_MARKERS = ['every day', 'every week', 'weekly', 'daily', 'monthly', 'each quarter', 'a few times', 'constantly', 'all the time', 'once a']
const ALT_MARKERS = ['spreadsheet', 'notion', 'we use', 'slack', 'airtable', 'internal tool', 'workaround', 'manually', 'by hand', 'google sheet']

// Weak-question detection ---------------------------------------------------
const WEAK_PATTERNS: { re: RegExp; problem: string }[] = [
  { re: /would you (use|pay|want|buy)/i, problem: 'Hypothetical — asks about an imagined future action.' },
  { re: /do you think/i, problem: 'Invites an opinion rather than a fact.' },
  { re: /don'?t you (find|think|hate|agree)/i, problem: 'Leading — signals the answer you want.' },
  { re: /is this a (good|great) idea/i, problem: 'Asks for a compliment, not evidence.' },
  { re: /how much would you pay/i, problem: 'Hypothetical pricing — unreliable without a real transaction.' },
  { re: /would (an? )?ai/i, problem: 'Pitches a solution and asks for a hypothetical.' },
  { re: /(like|love) (the|this|my) (idea|product|app|tool)/i, problem: 'Fishing for approval of your idea.' },
  { re: /would it help/i, problem: 'Hypothetical — people over-predict that things will help.' },
]

const STRONG_ALTERNATIVES = [
  'Tell me about the last time this happened.',
  'Walk me through exactly what you did.',
  'What triggered you to deal with it?',
  'How often does that happen?',
  'What did that cost you in time or money?',
  'What have you already tried to fix it?',
]

// ---------------------------------------------------------------------------
// Live-provider seam. Left unimplemented on purpose: wiring a real key into a
// public client bundle is unsafe. Point VITE_AI_PROXY_URL at a server route
// that forwards { prompt } to your model and returns schema-valid JSON.
// ---------------------------------------------------------------------------
async function callLLM(_prompt: string): Promise<unknown> {
  throw new Error(
    'Live AI provider not implemented in this build. Set VITE_AI_PROVIDER=mock, or ' +
      'implement callLLM() in src/ai/engine.ts against your proxy (see prompts.ts + schemas.ts).',
  )
}

// A tiny delay so the UI can show a "thinking" state realistically.
const think = <T>(value: T, ms = 450): Promise<T> =>
  new Promise(res => setTimeout(() => res(value), ms))

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const ai = {
  async critiqueProblem(statement: string): Promise<ProblemCritique> {
    if (!isMockAI) return ProblemCritiqueSchema.parse(await callLLM(PROMPT.problemCritique(statement)))
    const solutionWords = ['dashboard', 'platform', 'app', 'ai ', 'ai-', 'tool that', 'software that', 'system that', 'solution that', 'automate', 'saas', 'need a', 'needs a', 'needs an', 'need an']
    const hasConsequence = has(statement, ['causing', 'so that', 'because', 'which means', 'leading to', 'resulting in', 'costs', 'waste', 'wasting', 'lose', 'losing', 'miss'])
    const looksLikeSolution = has(statement, solutionWords) && !hasConsequence
    return think({
      looksLikeSolution,
      reasoning: looksLikeSolution
        ? 'This reads as a product or feature ("what to build") rather than a customer problem ("what hurts and why"). It names a solution shape but not the group, the situation, or the consequence.'
        : hasConsequence
        ? 'This describes a group and a consequence rather than jumping to a product. Good foundation — make sure the consequence is something you can observe in past behaviour.'
        : 'This is problem-shaped but thin. Add who experiences it, in what situation, and what it costs them, so it becomes observable.',
      suggestedRewrite: looksLikeSolution
        ? 'A specific group struggles to <do a real job> when <situation>, causing <observable consequence such as wasted time, money, or repeated mistakes>.'
        : undefined,
    })
  },

  async rewriteHypothesis(belief: string): Promise<HypothesisRewrite> {
    if (!isMockAI) return HypothesisRewriteSchema.parse(await callLLM(PROMPT.hypothesisRewrite(belief)))
    const issues: string[] = []
    if (!has(belief, ['when', 'during', 'after', 'while'])) issues.push('No context — add when the problem occurs.')
    if (!has(belief, ['causing', 'so', 'which means', 'leading', 'costs', 'waste'])) issues.push('No consequence — add what it costs them.')
    if (belief.length < 40) issues.push('Too vague — name the specific segment and situation.')
    if (has(belief, ['everyone', 'people', 'businesses', 'companies'])) issues.push('Segment is too broad to be observable.')
    return think({
      isTestable: issues.length === 0,
      issues,
      rewrite:
        'We believe [specific segment] experiences [problem] when [context], causing [observable consequence]. We will treat this as supported when we observe [evidence] across [N] relevant conversations.',
      suggestedDisconfirming:
        'Participants describe the situation but take no action, report no consequence, and have never spent time or money addressing it.',
    })
  },

  async suggestSegments(problem: string): Promise<SegmentSuggestion> {
    if (!isMockAI) return SegmentSuggestionSchema.parse(await callLLM(PROMPT.segmentSuggestions(problem)))
    return think({
      suggestions: [
        { name: 'Practitioners who own the workflow daily', rationale: 'Closest to the pain and its consequences.', observableTraits: ['Does the task themselves', 'Feels the cost first-hand', 'Has an existing workaround'] },
        { name: 'The person who holds the budget', rationale: 'Can convert urgency into spend.', observableTraits: ['Approves tool purchases', 'Measured on the outcome', 'Has bought adjacent tools before'] },
        { name: 'Teams recently burned by the problem', rationale: 'A trigger event makes them actively searching.', observableTraits: ['Had a recent visible failure', 'Currently evaluating options', 'Assigned someone to fix it'] },
      ],
    })
  },

  async generateGuide(ctx: { hypothesis: string; segment: string; objective: string; known: string; uncertain: string }): Promise<InterviewGuide> {
    if (!isMockAI) return InterviewGuideSchema.parse(await callLLM(PROMPT.interviewGuide(ctx)))
    return think({
      questions: [
        { section: 'context', text: `What does a typical week look like for you when it comes to ${ctx.objective || 'this area'}?`, rationale: 'Grounds the conversation in their real world before any specifics.' },
        { section: 'recent_occurrence', text: 'Tell me about the last time this came up. What happened?', rationale: 'Anchors on a real event, not a generalisation.' },
        { section: 'recent_occurrence', text: 'What triggered you to deal with it right then?', rationale: 'Surfaces the trigger event that turns a nuisance into action.' },
        { section: 'current_workflow', text: 'Walk me through, step by step, exactly what you did.', rationale: 'Reveals the real workflow and who is involved.' },
        { section: 'severity_consequences', text: 'What was the hardest part of that?', rationale: 'Finds where the real pain concentrates.' },
        { section: 'severity_consequences', text: 'What happened when it was left unresolved?', rationale: 'Tests whether there is a real consequence, i.e. urgency.' },
        { section: 'existing_alternatives', text: 'What are you using to handle this today?', rationale: 'Existing alternatives reveal willingness to invest.' },
        { section: 'previous_attempts', text: 'What have you already tried, and why did you stop?', rationale: 'Past attempts are strong evidence of felt need.' },
        { section: 'spending_resources', text: 'What does the current approach cost you in time or money?', rationale: 'Looks for existing spend and quantifiable cost.' },
        { section: 'decision_making', text: 'How did you choose your current approach, and who else was involved?', rationale: 'Identifies buyer vs. user and the decision process.' },
        { section: 'commitment', text: 'Who else is dealing with this that I should talk to?', rationale: 'A referral is a small but real commitment.' },
      ],
    })
  },

  async reviewQuestion(question: string): Promise<QuestionReview> {
    if (!isMockAI) return QuestionReviewSchema.parse(await callLLM(PROMPT.questionReview(question)))
    const hit = WEAK_PATTERNS.find(p => p.re.test(question))
    if (hit) {
      const replacement = STRONG_ALTERNATIVES[Math.abs(hashish(question)) % STRONG_ALTERNATIVES.length]
      return think({ verdict: 'weak' as const, problem: hit.problem, reason: 'Answers to this predict feelings or futures rather than reveal what the person has actually done. That is the least reliable kind of evidence.', replacement })
    }
    return think({ verdict: 'strong' as const, problem: null, reason: 'Asks about a concrete past event or current behaviour, which yields observable evidence.', replacement: null })
  },

  async extractEvidence(notes: string): Promise<EvidenceExtraction> {
    if (!isMockAI) return EvidenceExtractionSchema.parse(await callLLM(PROMPT.evidenceExtraction(notes)))
    const items = sentences(notes).map(s => classifySentence(s)).filter(Boolean) as EvidenceExtraction['items']
    return think({ items })
  },

  async feedback(notes: string, transcript?: string): Promise<InterviewFeedback> {
    if (!isMockAI) return InterviewFeedbackSchema.parse(await callLLM(PROMPT.interviewFeedback(notes, transcript)))
    return think(buildFeedback(notes, transcript), 650)
  },

  async consolidate(hypothesis: string, rows: { label: string; text: string }[]): Promise<Consolidation> {
    if (!isMockAI)
      return ConsolidationSchema.parse(
        await callLLM(PROMPT.consolidation(hypothesis, rows.map(r => `- ${r.label}: ${r.text}`).join('\n'))),
      )
    return think(buildConsolidation(rows))
  },

  async recommendDecision(hypothesis: string, consolidation: Consolidation): Promise<DecisionRecommendation> {
    if (!isMockAI)
      return DecisionRecommendationSchema.parse(
        await callLLM(PROMPT.decision(hypothesis, JSON.stringify(consolidation))),
      )
    return think(buildDecision(consolidation))
  },
}

// ---------------------------------------------------------------------------
// Heuristic internals
// ---------------------------------------------------------------------------
function hashish(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}

function classifySentence(s: string): EvidenceExtraction['items'][number] | null {
  const low = s.toLowerCase()
  const tags: string[] = []
  if (has(low, FREQUENCY_MARKERS)) tags.push('frequency')
  if (has(low, SPEND_MARKERS)) tags.push('spending')
  if (has(low, CONSEQUENCE_MARKERS)) tags.push('consequence')
  if (has(low, ALT_MARKERS)) tags.push('existing_solution')

  let kind: EvidenceExtraction['items'][number]['kind'] = 'stated_opinion'
  let direction: EvidenceExtraction['items'][number]['direction'] = 'unclear'
  let interp = 'Stated view; treat as a signal to verify against behaviour.'

  if (has(low, COMPLIMENT_MARKERS)) {
    kind = 'compliment'; direction = 'unclear'; interp = 'Encouragement, not evidence. Does not move the hypothesis.'
    tags.push('objection')
  } else if (has(low, HYPOTHETICAL_MARKERS)) {
    kind = 'hypothetical'; direction = 'unclear'; interp = 'A prediction about future behaviour. People over-predict; weight lightly.'
  } else if (has(low, COMMIT_MARKERS)) {
    kind = 'new_commitment'; direction = 'supports'; interp = 'A concrete next step — strong signal of real interest.'
    tags.push('commitment')
  } else if (has(low, SPEND_MARKERS)) {
    kind = 'existing_commitment'; direction = 'supports'; interp = 'Existing spend is one of the strongest forms of evidence.'
  } else if (has(low, PAST_MARKERS)) {
    kind = 'observed_past_behaviour'; direction = has(low, CONSEQUENCE_MARKERS) ? 'supports' : 'unclear'
    interp = 'Describes something they actually did — high-quality evidence.'
  } else if (has(low, CURRENT_MARKERS)) {
    kind = 'current_behaviour'; direction = 'supports'; interp = 'How they handle it today; reveals the real workflow.'
  } else if (has(low, ['not really', "doesn't", 'no big deal', "wouldn't", 'never had', 'not a problem', 'fine as is', "don't need"])) {
    kind = 'contradiction'; direction = 'contradicts'; interp = 'Cuts against the hypothesis. Do not discard it.'
    tags.push('contradiction')
  }

  // Skip filler sentences that carry no signal.
  if (kind === 'stated_opinion' && tags.length === 0 && s.length < 40) return null

  return { statement: s, quote: s, kind, direction, aiInterpretation: interp, tags: Array.from(new Set(tags)) }
}

function buildFeedback(notes: string, transcript?: string): InterviewFeedback {
  const t = notes + ' ' + (transcript ?? '')
  const dim = (key: string, label: string, present: boolean, whenGood: string, whenBad: string, better: string | null) => ({
    key, label,
    score: present ? clamp(4 + (hashish(key + notes) % 2)) : clamp(1 + (hashish(key) % 2)),
    whatHappened: present ? whenGood : whenBad,
    whyItMatters: present
      ? 'This is the kind of evidence that holds up: it is about what actually happened.'
      : 'Without this, the conversation drifts into opinion, which does not tell you whether the problem is real.',
    betterQuestion: present ? null : better,
  })

  const dimensions = [
    dim('past', 'Asked about past behaviour', has(t, PAST_MARKERS), 'The participant recounted specific past events.', 'The talk stayed general — no concrete "last time" story surfaced.', 'Tell me about the last time this happened.'),
    dim('examples', 'Asked for specific examples', has(t, ['for example', 'last time', 'specifically', 'walk me through']), 'Concrete examples anchored the discussion.', 'Answers stayed abstract.', 'Can you give me a specific recent example?'),
    dim('workflow', 'Explored the current workflow', has(t, CURRENT_MARKERS.concat(ALT_MARKERS)), 'You mapped how they handle it today.', 'The current workflow was left unexplored.', 'Walk me through exactly what you do today, step by step.'),
    dim('consequences', 'Investigated consequences', has(t, CONSEQUENCE_MARKERS), 'You uncovered the cost of the problem.', 'You never learned what happens if this goes unsolved.', 'What happens when you leave it unresolved?'),
    dim('frequency', 'Investigated frequency & urgency', has(t, FREQUENCY_MARKERS), 'Frequency was established.', 'How often this happens is still unknown.', 'How often does this happen?'),
    dim('solutions', 'Investigated existing solutions', has(t, ALT_MARKERS), 'Existing alternatives were surfaced.', 'You did not learn what they use today.', 'What are you using to handle this now?'),
    dim('spend', 'Investigated spending / resources', has(t, SPEND_MARKERS), 'You probed real spend.', 'Money and resource cost were not explored.', 'What does the current approach cost you?'),
    dim('leading', 'Avoided leading questions', !WEAK_PATTERNS.some(p => p.re.test(t)), 'Questions stayed neutral.', 'Some questions signalled the answer you wanted.', 'Rephrase to ask what they did, not what they think of your idea.'),
    dim('pitch', 'Avoided pitching', !has(t, ['our product', 'we built a', 'our tool', 'we are building', 'let me show you']), 'You held back the pitch and kept listening.', 'You pitched, which biases everything said afterwards.', 'Save the pitch — ask another question about their experience instead.'),
    dim('hypothetical', 'Avoided hypothetical questions', !has(t, ['would you', 'do you think you would']), 'You stayed on real events.', 'Hypotheticals crept in.', 'Swap "would you" for "when did you last".'),
    dim('listen', 'Let the participant speak', (transcript ? true : has(t, ['they said', 'participant', 'she said', 'he said', '"'])), 'The participant did most of the talking.', 'The balance leaned toward the interviewer.', 'Ask, then stay silent and let them fill the space.'),
    dim('nextstep', 'Reached a clear next step', has(t, COMMIT_MARKERS.concat(['follow up', 'intro', 'next week'])), 'You secured a concrete next step.', 'The conversation ended without a next step.', 'Who else should I talk to about this?'),
  ]

  const overallScore = Math.round((dimensions.reduce((a, d) => a + d.score, 0) / (dimensions.length * 5)) * 100)

  let talkRatio: InterviewFeedback['talkRatio'] = null
  if (transcript) {
    const lines = transcript.split('\n').filter(Boolean)
    const interviewerChars = lines.filter(l => /^(you|interviewer|founder|me)[:\-]/i.test(l.trim())).join(' ').length
    const total = transcript.length || 1
    const interviewerPct = Math.round((interviewerChars / total) * 100)
    talkRatio = {
      interviewerPct,
      customerPct: 100 - interviewerPct,
      note: interviewerPct > 45 ? 'You spoke more than a third of the time — aim to talk less and listen more.' : 'Healthy balance: the participant did most of the talking.',
    }
  }

  const missedFollowUps: InterviewFeedback['missedFollowUps'] = []
  sentences(notes).forEach(s => {
    if (has(s.toLowerCase(), ['spreadsheet', 'internal tool', 'we built', 'we made a']))
      missedFollowUps.push({ statement: s, suggestedFollowUps: ['Who built it?', 'How long did it take?', 'How often is it updated?', 'What breaks in it?', 'Why have you kept using it instead of something else?'] })
    if (has(s.toLowerCase(), ['we pay', 'subscription', 'we spend']))
      missedFollowUps.push({ statement: s, suggestedFollowUps: ['How did that purchase get approved?', 'What would make you switch away from it?', 'What does it not do that you wish it did?'] })
  })

  const weakest = dimensions.slice().sort((a, b) => a.score - b.score)[0]
  const strongest = dimensions.slice().sort((a, b) => b.score - a.score)[0]

  return {
    overallScore,
    talkRatio,
    dimensions,
    missedFollowUps: missedFollowUps.slice(0, 4),
    summary: {
      strongestEvidence: has(notes, SPEND_MARKERS) ? 'The participant already spends money in this area, which is hard evidence of felt need.' : has(notes, PAST_MARKERS) ? 'A concrete account of past behaviour rather than opinion.' : 'Some real workflow detail surfaced.',
      weakestEvidence: `Little signal on "${weakest.label.toLowerCase()}" — ${weakest.betterQuestion ?? 'probe this next time.'}`,
      surprisingInsight: has(notes, ALT_MARKERS) ? 'They have already improvised a workaround, suggesting the problem is real enough to solve themselves.' : 'Watch for whether this pain is felt strongly enough to act on.',
      contradiction: has(notes, ['not really', 'no big deal', 'not a problem', 'fine as is']) ? 'They downplayed the severity at one point — flag this against any enthusiasm elsewhere.' : 'No direct contradiction detected, but absence of consequence talk is itself a caution.',
      openQuestion: 'Is the consequence severe and frequent enough to change their behaviour or spend?',
      recommendedNextQuestion: weakest.betterQuestion ?? 'What would have to be true for you to change how you handle this?',
      hypothesesAffected: [],
    },
  }
}

function buildConsolidation(rows: { label: string; text: string }[]): Consolidation {
  const supporting: string[] = []
  const contradicting: string[] = []
  const unclear: string[] = []
  let behaviourCount = 0
  let spendCount = 0
  let frequencyCount = 0
  let consequenceCount = 0

  rows.forEach(r => {
    const low = r.text.toLowerCase()
    if (has(low, SPEND_MARKERS)) spendCount++
    if (has(low, FREQUENCY_MARKERS)) frequencyCount++
    if (has(low, CONSEQUENCE_MARKERS)) consequenceCount++
    if (has(low, PAST_MARKERS) || has(low, CURRENT_MARKERS)) behaviourCount++

    if (has(low, ['not really', 'no big deal', 'not a problem', 'fine as is', "wouldn't", "don't need"]))
      contradicting.push(`${r.label}: ${r.text}`)
    else if (has(low, PAST_MARKERS.concat(SPEND_MARKERS).concat(COMMIT_MARKERS)))
      supporting.push(`${r.label}: ${r.text}`)
    else unclear.push(`${r.label}: ${r.text}`)
  })

  const n = rows.length || 1
  // Quality-weighted, NOT majority vote.
  const behaviourRatio = behaviourCount / n
  const hasContradiction = contradicting.length > 0
  const strongEvidence = spendCount >= Math.ceil(n / 2) && consequenceCount >= Math.ceil(n / 2)

  let conclusion: Consolidation['conclusion']
  let recommendedStrength: Consolidation['recommendedStrength']
  if (contradicting.length > supporting.length && hasContradiction) {
    conclusion = 'contradicted'; recommendedStrength = 'contradicted'
  } else if (strongEvidence && behaviourRatio >= 0.5) {
    conclusion = 'supported'; recommendedStrength = 'strong'
  } else if (supporting.length >= 2 && (frequencyCount >= 2 || behaviourCount >= 2)) {
    conclusion = 'partially_supported'; recommendedStrength = 'mixed'
  } else if (supporting.length === 0 && contradicting.length === 0) {
    conclusion = 'inconclusive'; recommendedStrength = supporting.length ? 'weak' : 'none'
  } else {
    conclusion = 'inconclusive'; recommendedStrength = 'weak'
  }

  const reasoning =
    conclusion === 'supported'
      ? `Across ${n} conversations the problem shows up in real behaviour and existing spend, with consequences named repeatedly. This goes beyond stated interest.`
      : conclusion === 'partially_supported'
      ? `${supporting.length} of ${n} participants showed real signal, and the situation recurs (${frequencyCount} mentioned frequency), but only ${spendCount} showed existing spend and ${consequenceCount} described a real consequence. The problem looks frequent but its urgency is unproven.`
      : conclusion === 'contradicted'
      ? `More participants downplayed or dismissed the problem than supported it. Enthusiasm elsewhere does not outweigh people telling you it is not a real pain.`
      : `The evidence is thin or mixed. Nobody has yet shown behaviour or spend that would confirm the problem is worth solving. Treat current signal as opinion until behaviour backs it up.`

  return {
    conclusion,
    reasoning,
    relevantConversations: n,
    matchingSegments: 0,
    supporting,
    contradicting,
    unclear,
    patterns: [
      frequencyCount >= 2 ? `${frequencyCount} participants described this happening on a recurring basis.` : 'Frequency signal is weak across conversations.',
      spendCount >= 1 ? `${spendCount} already spend money or effort in this area.` : 'No existing spend surfaced yet.',
    ],
    outliers: contradicting.slice(0, 2),
    commonTriggers: [],
    commonWorkflows: [],
    commonConsequences: [],
    existingAlternatives: [],
    existingSpending: supporting.filter(s => has(s.toLowerCase(), SPEND_MARKERS)).slice(0, 3),
    commitmentStrength: rows.some(r => has(r.text.toLowerCase(), COMMIT_MARKERS)) ? 'At least one concrete commitment observed.' : 'No concrete commitments yet — interest remains verbal.',
    unansweredQuestions: [
      consequenceCount < Math.ceil(n / 2) ? 'Is the consequence of not solving this actually severe?' : 'What is the fully-loaded cost of the status quo?',
      spendCount === 0 ? 'Would anyone pay, or reallocate budget, to solve this?' : 'Who controls the budget for this?',
    ],
    recommendedStrength,
  }
}

function buildDecision(c: Consolidation): DecisionRecommendation {
  let recommended: DecisionRecommendation['recommended']
  switch (c.conclusion) {
    case 'supported': recommended = 'proceed_to_solution'; break
    case 'contradicted': recommended = 'pivot'; break
    case 'partially_supported': recommended = 'narrow_segment'; break
    default: recommended = 'continue_testing'
  }
  return {
    recommended,
    reasoning:
      recommended === 'proceed_to_solution'
        ? 'The problem is backed by behaviour and spend across enough conversations. It is safe to start testing whether a specific solution earns commitment.'
        : recommended === 'pivot'
        ? 'Participants are telling you this is not a pain worth solving. Redirect toward a problem where you saw real behaviour.'
        : recommended === 'narrow_segment'
        ? 'The signal is real but uneven. Narrow to the sub-group that showed consequence and spend, and re-test with them specifically.'
        : 'There is not yet enough behavioural evidence to decide. Run more focused interviews before committing.',
    remainingUncertainty: c.unansweredQuestions.join(' '),
    suggestedNextTest:
      recommended === 'narrow_segment'
        ? 'Interview five people who match the highest-signal segment and screen explicitly for a recent trigger event.'
        : recommended === 'proceed_to_solution'
        ? 'Design a small commitment test (a pilot or pre-order) and see who says yes with time or money.'
        : recommended === 'pivot'
        ? 'Revisit the interviews where you heard real pain and reframe the hypothesis around that.'
        : 'Run three more interviews focused on frequency and consequence.',
  }
}
