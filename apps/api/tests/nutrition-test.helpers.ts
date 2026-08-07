import type {
  NutritionCalculationResponse,
  NutritionHistoryResponse,
  NutritionLatestResponse,
  NutritionProfileInputsResponse,
} from '@metaform/shared-types'
import request, { type Response } from 'supertest'
import {
  ActivityLevel,
  FitnessGoal,
  Gender,
  UserRole,
} from '../src/generated/prisma/client.js'
import { app } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { signAccessToken } from '../src/security/jwt.service.js'

let sequence = 0

export const explicitNutritionInput = {
  age: 28,
  gender: Gender.MALE,
  heightCm: 178,
  weightKg: 82,
  activityLevel: ActivityLevel.MODERATE,
  goal: FitnessGoal.BUILD_MUSCLE,
}

const birthDateForAge = (age: number): Date => {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()),
  )
}

export const cleanNutritionTestData = async (): Promise<void> => {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'nutrition-test-' } },
  })
}

export const createNutritionUser = async (
  withCompleteProfile = false,
  profileOverrides: Record<string, unknown> = {},
) => {
  sequence += 1
  const user = await prisma.user.create({
    data: {
      email: `nutrition-test-${String(sequence)}@example.com`,
      passwordHash: 'not-used',
      profile: {
        create: {
          fullName: 'Nutrition Tester',
          ...(withCompleteProfile
            ? {
                birthDate: birthDateForAge(28),
                gender: Gender.MALE,
                heightCm: 178,
                currentWeightKg: 82,
                activityLevel: ActivityLevel.MODERATE,
                fitnessGoal: FitnessGoal.BUILD_MUSCLE,
              }
            : {}),
          ...profileOverrides,
        },
      },
    },
  })
  return {
    user,
    token: signAccessToken(user.id, UserRole.USER),
  }
}

export const nutritionApi = (token?: string) => ({
  get: (path: string) => {
    const call = request(app).get(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  },
  post: (path: string) => {
    const call = request(app).post(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  },
})

export const createStoredCalculation = async (
  userId: string,
  calculatedAt: Date,
  maintenanceCalories = 2400,
) =>
  prisma.nutritionCalculation.create({
    data: {
      userId,
      bmi: 24.5,
      bmr: 1700,
      tdee: maintenanceCalories,
      maintenanceCalories,
      bulkingCalories: maintenanceCalories + 300,
      cuttingCalories: maintenanceCalories - 500,
      proteinGrams: 150,
      carbohydrateGrams: 300,
      fatGrams: 65,
      waterLiters: 2.8,
      calculatedAt,
    },
  })

export const parseCalculation = (response: Response) =>
  JSON.parse(response.text) as NutritionCalculationResponse
export const parseLatest = (response: Response) =>
  JSON.parse(response.text) as NutritionLatestResponse
export const parseHistory = (response: Response) =>
  JSON.parse(response.text) as NutritionHistoryResponse
export const parseProfileInputs = (response: Response) =>
  JSON.parse(response.text) as NutritionProfileInputsResponse
