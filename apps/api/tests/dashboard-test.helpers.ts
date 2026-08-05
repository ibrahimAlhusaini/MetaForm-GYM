import request, { type Response } from 'supertest'
import type { DashboardSummaryResponse } from '@metaform/shared-types'
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

export const FIXED_NOW = new Date('2026-08-05T12:00:00.000Z')

let entitySequence = 0

export const utcDate = (daysFromToday: number, hour = 10): Date => {
  const date = new Date(FIXED_NOW)
  date.setUTCDate(date.getUTCDate() + daysFromToday)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

export const cleanDashboardTestData = async (): Promise<void> => {
  await prisma.exerciseLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.exercise.deleteMany({
    where: { slug: { startsWith: 'dashboard-test-' } },
  })
}

export const createDashboardUser = async (profileWeightKg?: string) => {
  entitySequence += 1

  const user = await prisma.user.create({
    data: {
      email: `dashboard-user-${String(entitySequence)}@example.com`,
      passwordHash: 'not-used-by-dashboard-tests',
      profile: {
        create: {
          fullName: 'Dashboard Tester',
          ...(profileWeightKg ? { currentWeightKg: profileWeightKg } : {}),
        },
      },
    },
  })

  return {
    user,
    accessToken: signAccessToken(user.id, UserRole.USER),
  }
}

export const getDashboard = (accessToken?: string) => {
  const dashboardRequest = request(app).get('/api/v1/dashboard/summary')
  return accessToken
    ? dashboardRequest.set('Authorization', `Bearer ${accessToken}`)
    : dashboardRequest
}

export const parseDashboard = (response: Response): DashboardSummaryResponse =>
  JSON.parse(response.text) as DashboardSummaryResponse

interface SessionInput {
  startedAt: Date
  completedAt: Date | null
}

export const createSession = async (userId: string, input: SessionInput) =>
  prisma.workoutSession.create({
    data: {
      userId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    },
  })

export const createExercise = async (name = 'Bench Press') => {
  entitySequence += 1

  return prisma.exercise.create({
    data: {
      name,
      slug: `dashboard-test-${String(entitySequence)}`,
      primaryMuscle: MuscleGroup.CHEST,
      equipmentType: EquipmentType.BARBELL,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      movementType: MovementType.COMPOUND,
      thumbnailUrl: 'https://example.com/exercise.jpg',
      isPublished: true,
    },
  })
}

export const createCustomMachine = async (
  userId: string,
  name = 'Chest Press',
) => {
  return prisma.customMachine.create({
    data: {
      userId,
      name,
      imageUrl: 'https://example.com/machine.jpg',
      targetMuscle: MuscleGroup.CHEST,
    },
  })
}

interface SetInput {
  weightKg: string | null
  isWarmup?: boolean
}

interface ExerciseLogInput {
  workoutSessionId: string
  orderIndex: number
  sets: readonly SetInput[]
  exerciseId?: string
  customMachineId?: string
}

export const createExerciseLog = async (input: ExerciseLogInput) =>
  prisma.exerciseLog.create({
    data: {
      workoutSessionId: input.workoutSessionId,
      orderIndex: input.orderIndex,
      ...(input.exerciseId ? { exerciseId: input.exerciseId } : {}),
      ...(input.customMachineId
        ? { customMachineId: input.customMachineId }
        : {}),
      sets: {
        create: input.sets.map((set, index) => ({
          setNumber: index + 1,
          weightKg: set.weightKg,
          isWarmup: set.isWarmup ?? false,
        })),
      },
    },
  })
