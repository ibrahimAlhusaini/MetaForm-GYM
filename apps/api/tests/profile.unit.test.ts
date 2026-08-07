import type { ProfileDetail } from '@metaform/shared-types'
import { describe, expect, it } from 'vitest'
import { calculateProfileCompleteness } from '../src/modules/profile/profile.completeness.js'
import { ageFromBirthDate } from '../src/utils/age.js'

const emptyProfile: ProfileDetail = {
  initialized: false,
  fullName: null,
  birthDate: null,
  gender: null,
  heightCm: null,
  currentWeightKg: null,
  activityLevel: null,
  fitnessGoal: null,
}

describe('profile domain helpers', () => {
  it('calculates empty, partial, and complete profile percentages', () => {
    expect(calculateProfileCompleteness(emptyProfile)).toMatchObject({
      percentage: 0,
      complete: false,
    })
    const partial = calculateProfileCompleteness({
      ...emptyProfile,
      initialized: true,
      fullName: 'Member',
      gender: 'PREFER_NOT_TO_SAY',
      heightCm: 175,
    })
    expect(partial.percentage).toBe(43)
    expect(partial.missingFields).toEqual([
      'birthDate',
      'currentWeightKg',
      'activityLevel',
      'fitnessGoal',
    ])
    const complete = calculateProfileCompleteness({
      initialized: true,
      fullName: 'Complete Member',
      birthDate: '1998-08-07',
      gender: 'MALE',
      heightCm: 178,
      currentWeightKg: 82,
      activityLevel: 'MODERATE',
      fitnessGoal: 'BUILD_MUSCLE',
    })
    expect(complete).toMatchObject({
      percentage: 100,
      complete: true,
      missingFields: [],
    })
  })

  it('treats a blank stored name as incomplete', () => {
    const result = calculateProfileCompleteness({
      ...emptyProfile,
      initialized: true,
      fullName: '   ',
    })
    expect(result.fields.fullName).toBe(false)
  })

  it('calculates age from UTC calendar components around a birthday', () => {
    const birthDate = new Date('2000-08-08T00:00:00.000Z')
    expect(ageFromBirthDate(birthDate, new Date('2026-08-07T23:59:59Z'))).toBe(
      25,
    )
    expect(ageFromBirthDate(birthDate, new Date('2026-08-08T00:00:00Z'))).toBe(
      26,
    )
  })
})
