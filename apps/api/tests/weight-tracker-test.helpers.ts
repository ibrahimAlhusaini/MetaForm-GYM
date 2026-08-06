import request, { type Response } from 'supertest'
import {
  DifficultyLevel,
  EquipmentType,
  MovementType,
  MuscleGroup,
  UserRole,
} from '../src/generated/prisma/client.js'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signAccessToken } from '../src/security/jwt.service.js'

let sequence = 0
export const FIXED_TIME = new Date('2026-08-06T18:00:00.000Z')

export const cleanWeightTrackerData = async (): Promise<void> => {
  await prisma.exerciseLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.exercise.deleteMany({
    where: { slug: { startsWith: 'weight-tracker-test-' } },
  })
}

export const createUser = async () => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `weight-tracker-${String(sequence)}@example.com`,
      passwordHash: 'not-used',
    },
  })
  return { user, token: signAccessToken(user.id, UserRole.USER) }
}

export const createExercise = async (name = 'Bench Press') => {
  sequence += 1
  return prisma.exercise.create({
    data: {
      name,
      slug: `weight-tracker-test-${String(sequence)}`,
      primaryMuscle: MuscleGroup.CHEST,
      equipmentType: EquipmentType.BARBELL,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      movementType: MovementType.COMPOUND,
      isPublished: true,
    },
  })
}

export const api = (token?: string) => ({
  get: (path: string) =>
    token
      ? request(app).get(path).set('Authorization', `Bearer ${token}`)
      : request(app).get(path),
  post: (path: string) =>
    token
      ? request(app).post(path).set('Authorization', `Bearer ${token}`)
      : request(app).post(path),
  patch: (path: string) =>
    token
      ? request(app).patch(path).set('Authorization', `Bearer ${token}`)
      : request(app).patch(path),
  delete: (path: string) =>
    token
      ? request(app).delete(path).set('Authorization', `Bearer ${token}`)
      : request(app).delete(path),
})

export const parseResponse = (response: Response): unknown =>
  JSON.parse(response.text) as unknown

interface TrackerSetBody {
  id: string
  setNumber: number
  reps: number | null
}

interface TrackerSessionBody {
  id: string
  completedAt: string | null
  exerciseLogs: { sets: TrackerSetBody[] }[]
}

interface TrackerHistoryBody {
  personalRecordKg: number | null
  averageRepresentativeWeightKg: number | null
  latestRepresentativeWeightKg: number | null
  previousRepresentativeWeightKg: number | null
  bestImprovementKg: number | null
  totalSessions: number
  chartPoints: unknown[]
  sessions: { items: unknown[]; pagination: { totalPages: number } }
}

export interface TrackerResponseBody {
  data: {
    machine: { id: string; description: string | null }
    items: Record<string, unknown>[]
    pagination: Record<string, unknown>
    session: TrackerSessionBody
    set: TrackerSetBody
    history: TrackerHistoryBody
  }
}

export const parseTrackerResponse = (response: Response): TrackerResponseBody =>
  parseResponse(response) as TrackerResponseBody

export const machinePayload = {
  name: 'Chest Press Machine',
  imageUrl: null,
  targetMuscle: 'CHEST',
  description: 'Plate loaded',
}
export const setPayload = {
  setNumber: 1,
  weightKg: 40,
  reps: 10,
  durationSeconds: null,
  distanceMeters: null,
  isWarmup: false,
}

export const createMachineViaApi = async (
  token: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await api(token)
    .post('/api/v1/weight-tracker/machines')
    .send({ ...machinePayload, ...overrides })
  return (parseResponse(response) as { data: { machine: { id: string } } }).data
    .machine
}

export const createSessionViaApi = async (
  token: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await api(token)
    .post('/api/v1/weight-tracker/sessions')
    .send({
      startedAt: '2026-08-06T15:00:00.000Z',
      completedAt: null,
      notes: 'Push workout',
      workoutPlanId: null,
      ...overrides,
    })
  return (parseResponse(response) as { data: { session: { id: string } } }).data
    .session
}

export const createLogViaApi = async (
  token: string,
  sessionId: string,
  source: { exerciseId?: string | null; customMachineId?: string | null },
  orderIndex = 0,
) => {
  const response = await api(token)
    .post(`/api/v1/weight-tracker/sessions/${sessionId}/logs`)
    .send({
      exerciseId: null,
      customMachineId: null,
      notes: null,
      orderIndex,
      ...source,
    })
  return (parseResponse(response) as { data: { log: { id: string } } }).data.log
}

export const createSetViaApi = async (
  token: string,
  logId: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await api(token)
    .post(`/api/v1/weight-tracker/logs/${logId}/sets`)
    .send({ ...setPayload, ...overrides })
  return (parseResponse(response) as { data: { set: { id: string } } }).data.set
}
