import { describe, expect, it } from 'vitest'
import {
  buildStrengthProgress,
  calculateBodyWeightTrend,
  calculateDurationMinutes,
  calculatePercentageChange,
  numericToNumber,
} from '../src/modules/dashboard/dashboard.analytics.js'

describe('dashboard analytics calculations', () => {
  it('calculates a normal percentage change', () => {
    expect(calculatePercentageChange(3, 2)).toBe(50)
  })

  it('returns zero when both percentage values are zero', () => {
    expect(calculatePercentageChange(0, 0)).toBe(0)
  })

  it('returns null when activity is new', () => {
    expect(calculatePercentageChange(2, 0)).toBeNull()
  })

  it('detects an increasing body-weight trend', () => {
    expect(
      calculateBodyWeightTrend([
        { date: '2026-08-01', weightKg: 77 },
        { date: '2026-08-05', weightKg: 78.5 },
      ]),
    ).toEqual({
      direction: 'INCREASING',
      changeKg: 1.5,
      percentageChange: 1.95,
    })
  })

  it('detects a decreasing body-weight trend', () => {
    expect(
      calculateBodyWeightTrend([
        { date: '2026-08-01', weightKg: 80 },
        { date: '2026-08-05', weightKg: 78 },
      ]),
    ).toMatchObject({ direction: 'DECREASING', changeKg: -2 })
  })

  it('uses the configured tolerance for a stable body-weight trend', () => {
    expect(
      calculateBodyWeightTrend([
        { date: '2026-08-01', weightKg: 78 },
        { date: '2026-08-05', weightKg: 78.1 },
      ]).direction,
    ).toBe('STABLE')
  })

  it('reports insufficient body-weight data', () => {
    expect(
      calculateBodyWeightTrend([{ date: '2026-08-05', weightKg: 78 }]),
    ).toEqual({
      direction: 'INSUFFICIENT_DATA',
      changeKg: null,
      percentageChange: null,
    })
  })

  it('floors workout duration to whole minutes', () => {
    expect(
      calculateDurationMinutes(
        new Date('2026-08-05T10:00:00Z'),
        new Date('2026-08-05T11:04:59Z'),
      ),
    ).toBe(64)
  })

  it('clamps a malformed negative workout duration to zero', () => {
    expect(
      calculateDurationMinutes(
        new Date('2026-08-05T11:00:00Z'),
        new Date('2026-08-05T10:00:00Z'),
      ),
    ).toBe(0)
  })

  it('converts and rounds Decimal-like values to finite numbers', () => {
    expect(numericToNumber({ toNumber: () => 78.556 })).toBe(78.56)
  })

  it('rejects non-finite numeric values', () => {
    expect(() => numericToNumber(Number.POSITIVE_INFINITY)).toThrow(
      'Dashboard analytics received a non-finite number',
    )
  })

  it('builds signed strength changes from chronological points', () => {
    const machines = buildStrengthProgress([
      {
        sourceType: 'EXERCISE',
        sourceId: 'exercise-id',
        name: 'Bench Press',
        imageUrl: null,
        targetMuscle: 'CHEST',
        personalRecordKg: 55,
        totalSessions: 2,
        completedAt: new Date('2026-08-01T10:00:00Z'),
        weightKg: 50,
      },
      {
        sourceType: 'EXERCISE',
        sourceId: 'exercise-id',
        name: 'Bench Press',
        imageUrl: null,
        targetMuscle: 'CHEST',
        personalRecordKg: 55,
        totalSessions: 2,
        completedAt: new Date('2026-08-05T10:00:00Z'),
        weightKg: 55,
      },
    ])

    expect(machines[0]).toMatchObject({
      latestWeightKg: 55,
      previousWeightKg: 50,
      changeKg: 5,
      percentageChange: 10,
    })
  })
})
