import type {
  NutritionCalculationData,
  NutritionHistoryItem,
  NutritionProfileInputs,
  NutritionResolvedInputs,
} from '@metaform/shared-types'
import { prisma } from '../../config/prisma.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from '../../utils/pagination.js'
import {
  calculateNutritionTargets,
  ageFromBirthDate,
} from './nutrition.calculator.js'
import {
  BMR_FORMULA,
  CALCULATION_VERSION,
  NUTRITION_DISCLAIMER,
} from './nutrition.constants.js'
import {
  decimalToNumber,
  mapNutritionHistoryItem,
  nutritionCalculationSelect,
} from './nutrition.mapper.js'
import type { ProfileInputValues } from './nutrition.types.js'
import {
  resolvedNutritionSchema,
  type CalculateNutritionInput,
  type NutritionHistoryInput,
} from './nutrition.validation.js'

const profileSelect = {
  birthDate: true,
  gender: true,
  heightCm: true,
  currentWeightKg: true,
  activityLevel: true,
  fitnessGoal: true,
} satisfies Prisma.ProfileSelect

const loadProfileValues = async (
  userId: string,
  now = new Date(),
): Promise<ProfileInputValues> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: profileSelect,
  })
  return {
    age: profile?.birthDate ? ageFromBirthDate(profile.birthDate, now) : null,
    gender: profile?.gender ?? null,
    heightCm: profile?.heightCm ? decimalToNumber(profile.heightCm) : null,
    weightKg: profile?.currentWeightKg
      ? decimalToNumber(profile.currentWeightKg)
      : null,
    activityLevel: profile?.activityLevel ?? null,
    goal: profile?.fitnessGoal ?? null,
  }
}

export const getNutritionProfileInputs = async (
  userId: string,
  now = new Date(),
): Promise<NutritionProfileInputs> => {
  const values = await loadProfileValues(userId, now)
  return {
    ...values,
    completeness: {
      age: values.age !== null,
      gender: values.gender !== null,
      heightCm: values.heightCm !== null,
      weightKg: values.weightKg !== null,
      activityLevel: values.activityLevel !== null,
      goal: values.goal !== null,
    },
  }
}

const resolveInputs = (
  request: CalculateNutritionInput,
  profile: ProfileInputValues,
): NutritionResolvedInputs => {
  const values = {
    age: request.age ?? profile.age,
    gender: request.gender ?? profile.gender,
    heightCm: request.heightCm ?? profile.heightCm,
    weightKg: request.weightKg ?? profile.weightKg,
    activityLevel: request.activityLevel ?? profile.activityLevel,
    goal: request.goal ?? profile.goal,
  }
  const missingFields = Object.entries(values)
    .filter(([, value]) => value === null)
    .map(([field]) => field)
  if (missingFields.length > 0)
    throw new AppError(400, 'Additional information is required', {
      missingFields,
    })
  const parsed = resolvedNutritionSchema.safeParse(values)
  if (!parsed.success) {
    const invalidFields = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
    ]
    throw new AppError(400, 'Nutrition inputs are not supported', {
      invalidFields,
    })
  }
  return {
    ...parsed.data,
    sources: {
      age: request.age === undefined ? 'PROFILE' : 'REQUEST',
      gender: request.gender === undefined ? 'PROFILE' : 'REQUEST',
      heightCm: request.heightCm === undefined ? 'PROFILE' : 'REQUEST',
      weightKg: request.weightKg === undefined ? 'PROFILE' : 'REQUEST',
      activityLevel:
        request.activityLevel === undefined ? 'PROFILE' : 'REQUEST',
      goal: request.goal === undefined ? 'PROFILE' : 'REQUEST',
    },
  }
}

export const calculateAndSaveNutrition = async (
  userId: string,
  request: CalculateNutritionInput,
  now = new Date(),
): Promise<NutritionCalculationData> => {
  const profile = await loadProfileValues(userId, now)
  const inputs = resolveInputs(request, profile)
  const results = calculateNutritionTargets(inputs)
  const row = await prisma.nutritionCalculation.create({
    data: {
      userId,
      ...results,
      gender: inputs.gender,
      age: inputs.age,
      heightCm: inputs.heightCm,
      weightKg: inputs.weightKg,
      activityLevel: inputs.activityLevel,
      fitnessGoal: inputs.goal,
      bmrFormula: BMR_FORMULA,
      calculationVersion: CALCULATION_VERSION,
      calculatedAt: now,
    },
    select: { id: true, calculatedAt: true },
  })
  return {
    calculationId: row.id,
    inputs,
    results,
    methodology: {
      bmrFormula: BMR_FORMULA,
      calorieAdjustment: 'STANDARD',
      macroStrategy: 'GOAL_BASED',
      calculationVersion: CALCULATION_VERSION,
    },
    disclaimer: NUTRITION_DISCLAIMER,
    calculatedAt: row.calculatedAt.toISOString(),
  }
}

export const getLatestNutrition = async (
  userId: string,
): Promise<NutritionHistoryItem | null> => {
  const row = await prisma.nutritionCalculation.findFirst({
    where: { userId },
    orderBy: [{ calculatedAt: 'desc' }, { id: 'desc' }],
    select: nutritionCalculationSelect,
  })
  return row ? mapNutritionHistoryItem(row) : null
}

export const getNutritionHistory = async (
  userId: string,
  query: NutritionHistoryInput,
) => {
  const where: Prisma.NutritionCalculationWhereInput = {
    userId,
    ...(query.dateFrom === undefined && query.dateTo === undefined
      ? {}
      : {
          calculatedAt: {
            ...(query.dateFrom === undefined ? {} : { gte: query.dateFrom }),
            ...(query.dateTo === undefined ? {} : { lte: query.dateTo }),
          },
        }),
  }
  const [items, totalItems] = await Promise.all([
    prisma.nutritionCalculation.findMany({
      where,
      orderBy: [{ calculatedAt: query.sortOrder }, { id: query.sortOrder }],
      skip: paginationSkip(query),
      take: query.limit,
      select: nutritionCalculationSelect,
    }),
    prisma.nutritionCalculation.count({ where }),
  ])
  return {
    items: items.map(mapNutritionHistoryItem),
    pagination: paginationMetadata(query, totalItems),
  }
}
