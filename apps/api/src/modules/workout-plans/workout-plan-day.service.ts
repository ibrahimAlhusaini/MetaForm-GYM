import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { WORKOUT_PLAN_LIMITS } from './workout-plan.constants.js'
import { reorderCompleteSet } from './workout-plan.reorder.js'
import { loadWorkoutPlanAfterMutation } from './workout-plan.service.js'
import {
  requireOwnedDay,
  requireOwnedPlan,
  translateWorkoutPlanError,
} from './workout-plan.visibility.js'
import type {
  CreatePlanDayInput,
  ReorderDaysInput,
  UpdatePlanDayInput,
} from './workout-plan.validation.js'

export const createWorkoutPlanDay = async (
  userId: string,
  planId: string,
  input: CreatePlanDayInput,
) => {
  try {
    await prisma.$transaction(async (client) => {
      await requireOwnedPlan(client, userId, planId)
      const count = await client.workoutPlanDay.count({
        where: { workoutPlanId: planId },
      })
      if (count >= WORKOUT_PLAN_LIMITS.maximumDays)
        throw new AppError(400, 'Workout plan day limit reached')
      await client.workoutPlanDay.create({
        data: {
          workoutPlanId: planId,
          dayOfWeek: input.dayOfWeek,
          name: input.name ?? null,
          notes: input.notes ?? null,
          isRestDay: input.isRestDay,
          orderIndex: input.orderIndex,
        },
      })
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    translateWorkoutPlanError(error)
  }
  return loadWorkoutPlanAfterMutation(userId, planId)
}

const dayUpdateData = (
  input: UpdatePlanDayInput,
): Prisma.WorkoutPlanDayUpdateInput => {
  const data: Prisma.WorkoutPlanDayUpdateInput = {}
  if (input.dayOfWeek !== undefined) data.dayOfWeek = input.dayOfWeek
  if (input.name !== undefined) data.name = input.name
  if (input.notes !== undefined) data.notes = input.notes
  if (input.isRestDay !== undefined) data.isRestDay = input.isRestDay
  if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex
  return data
}

export const updateWorkoutPlanDay = async (
  userId: string,
  dayId: string,
  input: UpdatePlanDayInput,
) => {
  let planId = ''
  try {
    await prisma.$transaction(async (client) => {
      const day = await requireOwnedDay(client, userId, dayId)
      planId = day.workoutPlanId
      if (input.isRestDay === true && day._count.exercises > 0)
        throw new AppError(
          409,
          'Remove all exercises before making this a rest day',
        )
      await client.workoutPlanDay.update({
        where: { id: dayId },
        data: dayUpdateData(input),
      })
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    translateWorkoutPlanError(error)
  }
  return loadWorkoutPlanAfterMutation(userId, planId)
}

export const deleteWorkoutPlanDay = async (userId: string, dayId: string) => {
  let planId = ''
  await prisma.$transaction(async (client) => {
    const day = await requireOwnedDay(client, userId, dayId)
    planId = day.workoutPlanId
    await client.workoutPlanDay.delete({ where: { id: dayId } })
  })
  return loadWorkoutPlanAfterMutation(userId, planId)
}

export const reorderWorkoutPlanDays = async (
  userId: string,
  planId: string,
  input: ReorderDaysInput,
) => {
  await prisma.$transaction(async (client) => {
    await requireOwnedPlan(client, userId, planId)
    const days = await client.workoutPlanDay.findMany({
      where: { workoutPlanId: planId },
      select: { id: true },
    })
    await reorderCompleteSet(
      input.items.map((item) => ({
        id: item.dayId,
        orderIndex: item.orderIndex,
      })),
      days.map((day) => day.id),
      (offset) =>
        client.workoutPlanDay.updateMany({
          where: { workoutPlanId: planId },
          data: { orderIndex: { increment: offset } },
        }),
      (item) =>
        client.workoutPlanDay.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
    )
  })
  return loadWorkoutPlanAfterMutation(userId, planId)
}
