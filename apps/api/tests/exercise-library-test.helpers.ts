import request, { type Response } from 'supertest'
import {
  DifficultyLevel,
  EquipmentType,
  MovementType,
  MuscleGroup,
  MuscleSubgroup,
  UserRole,
} from '../src/generated/prisma/client.js'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signAccessToken } from '../src/security/jwt.service.js'

let sequence = 0

export const cleanExerciseLibraryData = async (): Promise<void> => {
  await prisma.exerciseLog.deleteMany()
  await prisma.workoutPlanExercise.deleteMany()
  await prisma.user.deleteMany()
  await prisma.exercise.deleteMany()
}

export const createLibraryUser = async (role: UserRole = UserRole.USER) => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `exercise-library-${String(sequence)}@example.com`,
      passwordHash: 'not-used',
      role,
    },
  })
  return { user, token: signAccessToken(user.id, role) }
}

export const exercisePayload = {
  name: 'Incline Barbell Bench Press',
  description: 'Upper chest pressing movement',
  primaryMuscle: MuscleGroup.CHEST,
  muscleSubgroup: MuscleSubgroup.UPPER_CHEST,
  secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
  equipmentType: EquipmentType.BARBELL,
  difficultyLevel: DifficultyLevel.INTERMEDIATE,
  movementType: MovementType.COMPOUND,
  instructions: ['Set the bench to a low incline', 'Press with control'],
  commonMistakes: ['Using an excessive incline'],
  recommendedSets: 4,
  recommendedReps: '8-12',
  videoUrl: null,
  thumbnailUrl: null,
  isPublished: false,
}

export const createExerciseRecord = async (
  overrides: Record<string, unknown> = {},
) => {
  sequence += 1
  return prisma.exercise.create({
    data: {
      ...exercisePayload,
      slug: `exercise-library-test-${String(sequence)}`,
      ...overrides,
    },
  })
}

export const libraryApi = (token?: string) => ({
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

interface LibraryExerciseBody {
  id: string
  name: string
  slug: string
  description: string | null
  instructions: string[]
  isPublished: boolean
  videoUrl: string | null
}

export interface LibraryResponseBody {
  message: string
  data: {
    items: LibraryExerciseBody[]
    exercise: LibraryExerciseBody
    pagination: {
      page: number
      limit: number
      totalItems: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    primaryMuscles: string[]
    muscleSubgroupsByPrimaryMuscle: Record<string, string[]>
    equipmentTypes: string[]
    strengthProgress: { machines: { sourceId: string }[] }
  }
}

export const parseLibraryResponse = (response: Response): LibraryResponseBody =>
  JSON.parse(response.text) as LibraryResponseBody

interface ExerciseEnvelope {
  data: {
    exercise: {
      id: string
      slug: string
      name: string
      isPublished: boolean
      muscleSubgroup: string | null
      videoUrl: string | null
    }
  }
}

export const parseExerciseEnvelope = (response: Response): ExerciseEnvelope =>
  JSON.parse(response.text) as ExerciseEnvelope

export const createExerciseViaAdmin = async (
  token: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await libraryApi(token)
    .post('/api/v1/admin/exercises')
    .send({ ...exercisePayload, ...overrides })
  return { response, exercise: parseExerciseEnvelope(response).data.exercise }
}

export const submitExerciseViaAdmin = async (
  token: string,
  overrides: Record<string, unknown> = {},
) =>
  libraryApi(token)
    .post('/api/v1/admin/exercises')
    .send({ ...exercisePayload, ...overrides })
