import type {
  Machine,
  Pagination,
  SessionDetail,
  SessionSummary,
  SourceHistory,
} from '../../src/features/weight-tracker/types/weight-tracker.types.js'

export const pagination: Pagination = {
  page: 1,
  limit: 20,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}
export const machine: Machine = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Chest Press',
  imageUrl: null,
  targetMuscle: 'CHEST',
  description: 'Plate loaded',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-05T10:00:00.000Z',
}
export const sessionSummary: SessionSummary = {
  id: '22222222-2222-4222-8222-222222222222',
  workoutPlanId: null,
  startedAt: '2026-08-06T15:00:00.000Z',
  completedAt: '2026-08-06T16:00:00.000Z',
  durationMinutes: 60,
  notes: 'Push day',
  exerciseLogCount: 1,
  totalSetCount: 2,
  totalVolumeKg: 920,
  createdAt: '2026-08-06T15:00:00.000Z',
  updatedAt: '2026-08-06T16:00:00.000Z',
}
export const sessionDetail: SessionDetail = {
  ...sessionSummary,
  exerciseLogs: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      exerciseId: null,
      customMachineId: machine.id,
      notes: 'Controlled reps',
      orderIndex: 0,
      source: {
        type: 'machine',
        id: machine.id,
        name: machine.name,
        targetMuscle: machine.targetMuscle,
        imageUrl: null,
      },
      createdAt: sessionSummary.createdAt,
      updatedAt: sessionSummary.updatedAt,
      sets: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          setNumber: 1,
          weightKg: 40,
          reps: 10,
          durationSeconds: null,
          distanceMeters: null,
          isWarmup: false,
          isPersonalRecord: true,
          createdAt: sessionSummary.createdAt,
          updatedAt: sessionSummary.updatedAt,
        },
        {
          id: '55555555-5555-4555-8555-555555555555',
          setNumber: 2,
          weightKg: 52,
          reps: 10,
          durationSeconds: null,
          distanceMeters: null,
          isWarmup: false,
          isPersonalRecord: false,
          createdAt: sessionSummary.createdAt,
          updatedAt: sessionSummary.updatedAt,
        },
      ],
    },
  ],
}
export const history: SourceHistory = {
  source: {
    type: 'machine',
    id: machine.id,
    name: machine.name,
    imageUrl: null,
    targetMuscle: 'CHEST',
  },
  personalRecordKg: 60,
  averageRepresentativeWeightKg: 52.5,
  latestRepresentativeWeightKg: 60,
  previousRepresentativeWeightKg: 55,
  bestImprovementKg: 7.5,
  totalSessions: 2,
  totalSets: 4,
  chartPoints: [
    {
      workoutSessionId: sessionSummary.id,
      completedAt: sessionSummary.completedAt,
      representativeWeightKg: 60,
    },
  ],
  sessions: {
    items: [
      {
        workoutSessionId: sessionSummary.id,
        startedAt: sessionSummary.startedAt,
        completedAt: sessionSummary.completedAt,
        representativeWeightKg: 60,
        totalSets: 2,
        workingSets: 2,
        estimatedVolumeKg: 920,
        notes: 'Push day',
      },
    ],
    pagination,
  },
}
