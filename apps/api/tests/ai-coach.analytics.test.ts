import { describe, expect, it } from 'vitest'
import {
  analyzePlateau,
  classifyNextWorkout,
} from '../src/modules/ai-coach/analytics/source-guidance.analytics.js'
import { aiCoachResultSchema } from '../src/modules/ai-coach/provider/ai-coach-output.schema.js'

describe('AI Coach deterministic analytics', () => {
  it('requires sufficient data before classifying a plateau', () => {
    expect(analyzePlateau([50, 50]).classification).toBe('INSUFFICIENT_DATA')
  })
  it('detects progress and a bounded flat plateau', () => {
    expect(analyzePlateau([50, 52.5, 55]).classification).toBe('PROGRESSING')
    expect(analyzePlateau([50, 55, 55, 55, 55]).classification).toBe(
      'POSSIBLE_PLATEAU',
    )
  })
  it('classifies next-workout direction without inventing an exact load', () => {
    expect(classifyNextWorkout([50])).toBe('INSUFFICIENT_DATA')
    expect(classifyNextWorkout([50, 52.5])).toBe('CONSIDER_SMALL_PROGRESSION')
    expect(classifyNextWorkout([50, 50])).toBe('MAINTAIN_LOAD_INCREASE_REPS')
    expect(classifyNextWorkout([50, 47.5])).toBe(
      'REPEAT_OR_PRIORITIZE_RECOVERY',
    )
  })
  it('rejects malformed provider output and unknown fields', () => {
    expect(
      aiCoachResultSchema.safeParse({ headline: 'Incomplete' }).success,
    ).toBe(false)
    expect(
      aiCoachResultSchema.safeParse({
        headline: 'x',
        summary: 'x',
        findings: [],
        recommendations: [],
        evidence: [],
        cautions: [],
        rawPrompt: 'secret',
      }).success,
    ).toBe(false)
  })
})
