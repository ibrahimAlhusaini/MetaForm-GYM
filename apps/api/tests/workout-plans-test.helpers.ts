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
const prefix = 'workout-plan-test-'

export const cleanWorkoutPlanData = async (): Promise<void> => {
  await prisma.workoutPlan.deleteMany({
    where: {
      OR: [
        { name: { startsWith: prefix } },
        { user: { email: { startsWith: prefix } } },
      ],
    },
  })
  await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } })
  await prisma.exercise.deleteMany({ where: { slug: { startsWith: prefix } } })
}

export const createPlanUser = async (role: UserRole = UserRole.USER) => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `${prefix}${String(sequence)}@example.com`,
      passwordHash: 'not-used',
      role,
    },
  })
  return { user, token: signAccessToken(user.id, role) }
}

export const createPlanExercise = async (
  name = 'Bench Press',
  isPublished = true,
) => {
  sequence += 1
  return prisma.exercise.create({
    data: {
      name,
      slug: `${prefix}${String(sequence)}`,
      primaryMuscle: MuscleGroup.CHEST,
      muscleSubgroup: 'MIDDLE_CHEST',
      equipmentType: EquipmentType.BARBELL,
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      movementType: MovementType.COMPOUND,
      thumbnailUrl: null,
      isPublished,
    },
  })
}

export const createStoredPlan = async ({
  userId,
  exerciseId,
  name = `${prefix}Stored Plan`,
  isPublic = false,
  isTemplate = false,
}: {
  userId: string | null
  exerciseId?: string
  name?: string
  isPublic?: boolean
  isTemplate?: boolean
}) =>
  prisma.workoutPlan.create({
    data: {
      userId,
      name,
      description: 'Stored plan description',
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      isPublic,
      isTemplate,
      ...(exerciseId
        ? {
            days: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  name: 'Second by order',
                  isRestDay: false,
                  orderIndex: 1,
                  exercises: {
                    create: [
                      {
                        exerciseId,
                        sets: 3,
                        reps: '10',
                        restSeconds: 90,
                        orderIndex: 1,
                      },
                      {
                        exerciseId,
                        sets: 4,
                        reps: '8',
                        restSeconds: 120,
                        orderIndex: 0,
                      },
                    ],
                  },
                },
                {
                  dayOfWeek: 'MONDAY',
                  name: 'First by order',
                  isRestDay: true,
                  orderIndex: 0,
                },
              ],
            },
          }
        : {}),
    },
    include: { days: { include: { exercises: true } } },
  })

export const planPayload = (exerciseId: string) => ({
  name: `${prefix}Weekly Strength`,
  description: 'A deterministic weekly plan',
  difficultyLevel: 'INTERMEDIATE',
  isTemplate: false,
  days: [
    {
      dayOfWeek: 'MONDAY',
      name: 'Training',
      notes: 'Primary day',
      isRestDay: false,
      orderIndex: 0,
      exercises: [
        {
          exerciseId,
          sets: 4,
          reps: '8-12',
          restSeconds: 120,
          notes: 'Controlled tempo',
          orderIndex: 0,
        },
      ],
    },
    {
      dayOfWeek: 'TUESDAY',
      name: 'Recovery',
      notes: null,
      isRestDay: true,
      orderIndex: 1,
      exercises: [],
    },
  ],
})

export const planApi = (token?: string) => ({
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

export const responseBody = <T>(
  response: Response,
  _typeGuard?: (value: T) => boolean,
): T => {
  void _typeGuard
  return JSON.parse(response.text) as T
}

export interface PlanResponseBody {
  success: boolean
  message?: string
  data: {
    id: string
    name: string
    isPublic: boolean
    isTemplate: boolean
    ownershipType: string
    templateType: string | null
    totalDays: number
    trainingDays: number
    restDays: number
    totalExercises: number
    days: {
      id: string
      dayOfWeek: string
      isRestDay: boolean
      orderIndex: number
      exercises: {
        id: string
        orderIndex: number
        sets: number | null
        exercise: { id: string; name: string }
      }[]
    }[]
    items: {
      id: string
      name: string
      ownershipType: string
      templateType: string | null
    }[]
    pagination: { page: number; limit: number; totalItems: number }
  }
}
