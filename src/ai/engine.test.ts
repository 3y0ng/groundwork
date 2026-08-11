import { describe, it, expect } from 'vitest'
import { ai, isMockAI } from './engine'

// These exercise the heuristic mock engine (the default with no key). They pin
// the behaviours that protect a founder from fooling themselves.

describe('mock engine is active in tests', () => {
  it('defaults to the mock provider', () => {
    expect(isMockAI).toBe(true)
  })
})

describe('critiqueProblem, separates problem from solution', () => {
  it('flags a solution-shaped statement', async () => {
    const r = await ai.critiqueProblem('Small businesses need an AI analytics dashboard.')
    expect(r.looksLikeSolution).toBe(true)
    expect(r.suggestedRewrite).toBeTruthy()
  })

  it('accepts a problem with a real consequence', async () => {
    const r = await ai.critiqueProblem(
      'Small marketing teams struggle to see why creatives perform differently, causing repeated poor decisions and wasted budget.',
    )
    expect(r.looksLikeSolution).toBe(false)
  })
})

describe('reviewQuestion, catches weak questions', () => {
  it('flags a hypothetical', async () => {
    const r = await ai.reviewQuestion('Would you use this?')
    expect(r.verdict).toBe('weak')
    expect(r.replacement).toBeTruthy()
  })

  it('flags a leading question', async () => {
    expect((await ai.reviewQuestion("Don't you find this frustrating?")).verdict).toBe('weak')
  })

  it('passes a question about a real past event', async () => {
    expect((await ai.reviewQuestion('Tell me about the last time this happened.')).verdict).toBe('strong')
  })
})

describe('extractEvidence, classifies, never invents', () => {
  it('labels spend as strong evidence and compliments as compliments', async () => {
    const { items } = await ai.extractEvidence(
      'We currently pay $400 a month for a tool to handle this. Honestly this is a great idea.',
    )
    const kinds = items.map(i => i.kind)
    expect(kinds).toContain('existing_commitment')
    expect(kinds).toContain('compliment')
    // Every quote must be text that appears in the source notes (no fabrication).
    const source = 'We currently pay $400 a month for a tool to handle this. Honestly this is a great idea.'
    for (const it of items) expect(source).toContain(it.quote)
  })
})

describe('consolidate, reasons, not majority vote', () => {
  it('concludes "contradicted" when participants dismiss the problem', async () => {
    const rows = [
      { label: 'A', text: 'not really a big deal, the spreadsheet is fine as is' },
      { label: 'B', text: 'not a problem for us, we would not need that' },
    ]
    const c = await ai.consolidate('belief', rows)
    expect(c.conclusion).toBe('contradicted')
  })

  it('concludes "supported" when behaviour, spend, and consequence recur', async () => {
    const rows = [
      { label: 'A', text: 'last month we paid $400 and it cost us $6000 wasted, happens weekly' },
      { label: 'B', text: 'last week we spent budget on this, it cost us real money, every week' },
    ]
    const c = await ai.consolidate('belief', rows)
    expect(c.conclusion).toBe('supported')
    expect(c.reasoning).toBeTruthy()
  })
})
