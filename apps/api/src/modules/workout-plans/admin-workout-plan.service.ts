import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { mapPlanDetail, planDetailSelect } from './workout-plan.mapper.js'
import { createPlanAggregate } from './workout-plan.nested-create.js'
import { workoutPlanUpdateData } from './workout-plan.service.js'
import {
  requireSystemPlan,
  translateWorkoutPlanError,
  workoutPlanNotFound,
} from './workout-plan.visibility.js'
import type {
  CreateAdminWorkoutPlanInput,
  UpdateWorkoutPlanInput,
} from './workout-plan.validation.js'

const assertPublishableInput = (input: CreateAdminWorkoutPlanInput): void => {
  const trainingDays = input.days.filter((day) => !day.isRestDay)
  if (
    input.days.length === 0 ||
    trainingDays.length === 0 ||
    trainingDays.some((day) => day.exercises.length === 0)
  )
    throw new AppError(
      400,
      'Public plans require at least one populated training day',
    )
}

const requirePublishableSystemPlan = async (planId: string) => {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId: null },
    select: {
      id: true,
      days: {
        select: {
          isRestDay: true,
          exercises: {
            select: { exercise: { select: { isPublished: true } } },
          },
        },
      },
    },
  })
  if (!plan) return workoutPlanNotFound()
  const trainingDays = plan.days.filter((day) => !day.isRestDay)
  const hasInvalidStructure =
    plan.days.length === 0 ||
    trainingDays.length === 0 ||
    trainingDays.some((day) => day.exercises.length === 0) ||
    plan.days.some(
      (day) =>
        (day.isRestDay && day.exercises.length > 0) ||
        day.exercises.some((item) => !item.exercise.isPublished),
    )
  if (hasInvalidStructure)
    throw new AppError(
      409,
      'Workout plan is not structurally valid for publication',
    )
}

export const createAdminWorkoutPlan = async (
  adminUserId: string,
  input: CreateAdminWorkoutPlanInput,
) => {
  if (input.isPublic) assertPublishableInput(input)
  try {
    const row = await prisma.$transaction((client) =>
      createPlanAggregate(client, null, input),
    )
    return mapPlanDetail(row, adminUserId)
  } catch (error) {
    if (error instanceof AppError) throw error
    return translateWorkoutPlanError(error)
  }
}

export const updateAdminWorkoutPlan = async (
  adminUserId: string,
  planId: string,
  input: UpdateWorkoutPlanInput,
) => {
  await prisma.$transaction(async (client) => {
    await requireSystemPlan(client, planId)
    await client.workoutPlan.update({
      where: { id: planId },
      data: workoutPlanUpdateData(input),
    })
  })
  const row = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    select: planDetailSelect,
  })
  return row ? mapPlanDetail(row, adminUserId) : workoutPlanNotFound()
}

export const publishAdminWorkoutPlan = async (
  adminUserId: string,
  planId: string,
) => {
  await requirePublishableSystemPlan(planId)
  const row = await prisma.workoutPlan.update({
    where: { id: planId },
    data: { isPublic: true },
    select: planDetailSelect,
  })
  return mapPlanDetail(row, adminUserId)
}

export const unpublishAdminWorkoutPlan = async (
  adminUserId: string,
  planId: string,
) => {
  await requireSystemPlan(prisma, planId)
  const row = await prisma.workoutPlan.update({
    where: { id: planId },
    data: { isPublic: false },
    select: planDetailSelect,
  })
  return mapPlanDetail(row, adminUserId)
}

export const deleteAdminWorkoutPlan = async (planId: string): Promise<void> => {
  await prisma.$transaction(async (client) => {
    await requireSystemPlan(client, planId)
    await client.workoutPlan.delete({ where: { id: planId } })
  })
}
