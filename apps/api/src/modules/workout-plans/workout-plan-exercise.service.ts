import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { WORKOUT_PLAN_LIMITS } from './workout-plan.constants.js'
import { validatePublishedExerciseIds } from './workout-plan.exercise-validation.js'
import { reorderCompleteSet } from './workout-plan.reorder.js'
import { loadWorkoutPlanAfterMutation } from './workout-plan.service.js'
import {
  requireOwnedDay,
  requireOwnedPlanExercise,
  translateWorkoutPlanError,
} from './workout-plan.visibility.js'
import type {
  CreatePlannedExerciseInput,
  ReorderExercisesInput,
  UpdatePlannedExerciseInput,
} from './workout-plan.validation.js'

export const createPlannedExercise = async (
  userId: string,
  dayId: string,
  input: CreatePlannedExerciseInput,
) => {
  let planId = ''
  try {
    await prisma.$transaction(async (client) => {
      const day = await requireOwnedDay(client, userId, dayId)
      planId = day.workoutPlanId
      if (day.isRestDay)
        throw new AppError(409, 'Exercises cannot be added to a rest day')
      if (day._count.exercises >= WORKOUT_PLAN_LIMITS.maximumExercisesPerDay)
        throw new AppError(400, 'Workout plan exercise limit reached')
      await validatePublishedExerciseIds(client, [input.exerciseId])
      await client.workoutPlanExercise.create({
        data: {
          workoutPlanDayId: dayId,
          exerciseId: input.exerciseId,
          sets: input.sets ?? null,
          reps: input.reps ?? null,
          restSeconds: input.restSeconds ?? null,
          notes: input.notes ?? null,
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

const exerciseUpdateData = (
  input: UpdatePlannedExerciseInput,
): Prisma.WorkoutPlanExerciseUpdateInput => {
  const data: Prisma.WorkoutPlanExerciseUpdateInput = {}
  if (input.exerciseId !== undefined)
    data.exercise = { connect: { id: input.exerciseId } }
  if (input.sets !== undefined) data.sets = input.sets
  if (input.reps !== undefined) data.reps = input.reps
  if (input.restSeconds !== undefined) data.restSeconds = input.restSeconds
  if (input.notes !== undefined) data.notes = input.notes
  if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex
  return data
}

export const updatePlannedExercise = async (
  userId: string,
  planExerciseId: string,
  input: UpdatePlannedExerciseInput,
) => {
  let dayId = ''
  let planId = ''
  try {
    await prisma.$transaction(async (client) => {
      const item = await requireOwnedPlanExercise(
        client,
        userId,
        planExerciseId,
      )
      dayId = item.workoutPlanDayId
      const day = await requireOwnedDay(client, userId, dayId)
      planId = day.workoutPlanId
      if (input.exerciseId)
        await validatePublishedExerciseIds(client, [input.exerciseId])
      await client.workoutPlanExercise.update({
        where: { id: planExerciseId },
        data: exerciseUpdateData(input),
      })
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    translateWorkoutPlanError(error)
  }
  return loadWorkoutPlanAfterMutation(userId, planId)
}

export const deletePlannedExercise = async (
  userId: string,
  planExerciseId: string,
) => {
  let planId = ''
  await prisma.$transaction(async (client) => {
    const item = await requireOwnedPlanExercise(client, userId, planExerciseId)
    const day = await requireOwnedDay(client, userId, item.workoutPlanDayId)
    planId = day.workoutPlanId
    await client.workoutPlanExercise.delete({ where: { id: planExerciseId } })
  })
  return loadWorkoutPlanAfterMutation(userId, planId)
}

export const reorderPlannedExercises = async (
  userId: string,
  dayId: string,
  input: ReorderExercisesInput,
) => {
  let planId = ''
  await prisma.$transaction(async (client) => {
    const day = await requireOwnedDay(client, userId, dayId)
    planId = day.workoutPlanId
    const items = await client.workoutPlanExercise.findMany({
      where: { workoutPlanDayId: dayId },
      select: { id: true },
    })
    await reorderCompleteSet(
      input.items.map((item) => ({
        id: item.planExerciseId,
        orderIndex: item.orderIndex,
      })),
      items.map((item) => item.id),
      (offset) =>
        client.workoutPlanExercise.updateMany({
          where: { workoutPlanDayId: dayId },
          data: { orderIndex: { increment: offset } },
        }),
      (item) =>
        client.workoutPlanExercise.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        }),
    )
  })
  return loadWorkoutPlanAfterMutation(userId, planId)
}
