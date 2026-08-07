import type {
  WorkoutPlanDetail,
  WorkoutPlanSummary,
} from '@metaform/shared-types'
import { exerciseOption } from './exercise-library.fixture.js'

export const planSummary: WorkoutPlanSummary = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Upper / Lower Foundation',
  description: 'A balanced weekly strength plan.',
  difficultyLevel: 'INTERMEDIATE',
  isTemplate: true,
  isPublic: true,
  ownershipType: 'SYSTEM',
  templateType: 'SYSTEM_TEMPLATE',
  totalDays: 2,
  trainingDays: 1,
  restDays: 1,
  totalExercises: 1,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
}

export const ownedPlanSummary: WorkoutPlanSummary = {
  ...planSummary,
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'My Strength Week',
  isTemplate: false,
  isPublic: false,
  ownershipType: 'USER',
  templateType: null,
}

export const planDetail: WorkoutPlanDetail = {
  ...planSummary,
  days: [
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      dayOfWeek: 'MONDAY',
      name: 'Upper body',
      notes: 'Controlled working sets.',
      isRestDay: false,
      orderIndex: 0,
      exercises: [
        {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          exercise: exerciseOption,
          sets: 4,
          reps: '8-12',
          restSeconds: 90,
          notes: 'Leave two reps in reserve.',
          orderIndex: 0,
        },
      ],
    },
    {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      dayOfWeek: 'TUESDAY',
      name: null,
      notes: 'Recovery and mobility.',
      isRestDay: true,
      orderIndex: 1,
      exercises: [],
    },
  ],
}

export const ownedPlanDetail: WorkoutPlanDetail = {
  ...planDetail,
  ...ownedPlanSummary,
}

export const planPagination = {
  page: 1,
  limit: 12,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
