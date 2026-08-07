import { describe, expect, it } from 'vitest'
import i18n from '../src/i18n/index.js'
import { moveItem } from '../src/features/workout-plans/utils/workout-plan-order.js'
import { createPlanPayload } from '../src/features/workout-plans/utils/workout-plan-payload.js'
import { createPlanDraftSchema } from '../src/features/workout-plans/validation/workout-plan.schemas.js'
import { sessionPayload } from '../src/features/weight-tracker/utils/payload-transformers.js'
import { exerciseOption } from './fixtures/exercise-library.fixture.js'

const t = i18n.getFixedT('en', ['workoutPlans', 'common'])

describe('Workout Plan pure state and payload rules', () => {
  it('moves items without mutating input and preserves logical data order', () => {
    const source = ['monday', 'tuesday', 'wednesday']
    expect(moveItem(source, 0, 1)).toEqual(['tuesday', 'monday', 'wednesday'])
    expect(source).toEqual(['monday', 'tuesday', 'wednesday'])
    expect(moveItem(source, 0, -1)).toEqual(source)
  })

  it('builds a complete contiguous nested create payload', () => {
    const payload = createPlanPayload(
      {
        name: ' Strength week ',
        description: ' ',
        difficultyLevel: 'INTERMEDIATE',
        isTemplate: true,
      },
      [
        {
          dayOfWeek: 'MONDAY',
          name: 'Upper',
          notes: '',
          isRestDay: false,
          exercises: [
            {
              exercise: exerciseOption,
              sets: '4',
              reps: '8-12',
              restSeconds: '90',
              notes: '',
            },
          ],
        },
        {
          dayOfWeek: 'TUESDAY',
          name: '',
          notes: '',
          isRestDay: true,
          exercises: [],
        },
      ],
    )
    expect(payload).toEqual(
      expect.objectContaining({
        name: 'Strength week',
        description: null,
        difficultyLevel: 'INTERMEDIATE',
        isTemplate: true,
      }),
    )
    expect(payload.days).toEqual([
      expect.objectContaining({ orderIndex: 0, isRestDay: false }),
      expect.objectContaining({
        orderIndex: 1,
        isRestDay: true,
        exercises: [],
      }),
    ])
    expect(payload.days?.[0]?.exercises?.[0]).toEqual(
      expect.objectContaining({ exerciseId: exerciseOption.id, orderIndex: 0 }),
    )
  })

  it('rejects duplicate weekdays, invalid prescriptions, and exercises on rest days', () => {
    const result = createPlanDraftSchema(t).safeParse([
      {
        dayOfWeek: 'MONDAY',
        name: '',
        notes: '',
        isRestDay: true,
        exercises: [
          {
            exercise: exerciseOption,
            sets: '0',
            reps: '',
            restSeconds: '90000',
            notes: '',
          },
        ],
      },
      {
        dayOfWeek: 'MONDAY',
        name: '',
        notes: '',
        isRestDay: false,
        exercises: [],
      },
    ])
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          'Each weekday may appear only once',
          'Rest days cannot contain exercises',
          'Sets must be between 1 and 100',
          'Enter a whole number from 0 to 86400',
        ]),
      )
  })

  it('keeps plan context separate while preserving exactly one session source', () => {
    const payload = sessionPayload({
      workoutPlanId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      startedAt: '2026-08-07T10:00',
      notes: '',
      completeImmediately: false,
      entries: [
        {
          sourceType: 'exercise',
          exerciseId: exerciseOption.id,
          customMachineId: '',
          notes: '',
          sets: [
            {
              setNumber: 1,
              weightKg: '60',
              reps: '10',
              durationSeconds: '',
              distanceMeters: '',
              isWarmup: false,
            },
          ],
        },
      ],
    })
    expect(payload.workoutPlanId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(payload.entries[0]).toEqual(
      expect.objectContaining({
        exerciseId: exerciseOption.id,
        customMachineId: null,
      }),
    )
  })
})
