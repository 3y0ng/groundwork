import { describe, it, expect } from 'vitest'
import { scoreEvidence } from './useStore'
import type { EvidenceItem, EvidenceKind, EvidenceDirection } from '@/types/domain'

// Build a minimal evidence item; only kind + direction matter to scoring.
let n = 0
function ev(kind: EvidenceKind, direction: EvidenceDirection): EvidenceItem {
  n++
  return {
    id: `e${n}`, projectId: 'p', interviewId: 'i', statement: '', quote: '',
    kind, direction, hypothesisIds: ['h'], strength: 'weak',
    founderInterpretation: '', aiInterpretation: '', tags: [], createdAt: '',
  }
}

describe('scoreEvidence, quality is weighted, not counted', () => {
  it('returns "none" for no evidence', () => {
    expect(scoreEvidence([]).strength).toBe('none')
  })

  it('treats compliments as worthless, three of them are still "none"', () => {
    const s = scoreEvidence([
      ev('compliment', 'supports'), ev('compliment', 'supports'), ev('compliment', 'supports'),
    ])
    expect(s.supportWeight).toBe(0)
    expect(s.strength).toBe('none')
  })

  it('does not let hypotheticals reach "strong"', () => {
    const s = scoreEvidence(Array.from({ length: 6 }, () => ev('hypothetical', 'supports')))
    expect(s.strength).not.toBe('strong')
  })

  it('reaches "strong" only with enough real behaviour', () => {
    const s = scoreEvidence([
      ev('observed_past_behaviour', 'supports'),
      ev('observed_past_behaviour', 'supports'),
      ev('existing_commitment', 'supports'),
    ])
    expect(s.behaviourItems).toBe(3)
    expect(s.strength).toBe('strong')
  })

  it('a single strong behavioural item is "mixed", not "strong"', () => {
    expect(scoreEvidence([ev('existing_commitment', 'supports')]).strength).toBe('mixed')
  })

  it('lets contradictions outweigh a compliment', () => {
    const s = scoreEvidence([ev('compliment', 'supports'), ev('contradiction', 'contradicts')])
    expect(s.contraWeight).toBeGreaterThan(s.supportWeight)
    expect(s.strength).toBe('contradicted')
  })

  it('counts a supporting opinion as weak, not more', () => {
    expect(scoreEvidence([ev('stated_opinion', 'supports')]).strength).toBe('weak')
  })
})
