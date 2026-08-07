import { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../utils/app-error.js'
import {
  WORKOUT_PLAN_CONFLICT,
  WORKOUT_PLAN_NOT_FOUND,
} from './workout-plan.constants.js'

type Client = Prisma.TransactionClient

export const workoutPlanNotFound = (): never => {
  throw new AppError(404, WORKOUT_PLAN_NOT_FOUND)
}

export const visiblePlanWhere = (
  userId: string,
): Prisma.WorkoutPlanWhereInput => ({
  OR: [{ userId }, { isPublic: true }],
})

export const requireOwnedPlan = async (
  client: Client,
  userId: string,
  planId: string,
) => {
  const plan = await client.workoutPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  })
  return plan ?? workoutPlanNotFound()
}

export const requireSystemPlan = async (client: Client, planId: string) => {
  const plan = await client.workoutPlan.findFirst({
    where: { id: planId, userId: null },
    select: { id: true },
  })
  return plan ?? workoutPlanNotFound()
}

export const requireOwnedDay = async (
  client: Client,
  userId: string,
  dayId: string,
) => {
  const day = await client.workoutPlanDay.findFirst({
    where: { id: dayId, workoutPlan: { userId } },
    select: {
      id: true,
      workoutPlanId: true,
      isRestDay: true,
      _count: { select: { exercises: true } },
    },
  })
  return day ?? workoutPlanNotFound()
}

export const requireOwnedPlanExercise = async (
  client: Client,
  userId: string,
  planExerciseId: string,
) => {
  const item = await client.workoutPlanExercise.findFirst({
    where: {
      id: planExerciseId,
      workoutPlanDay: { workoutPlan: { userId } },
    },
    select: { id: true, workoutPlanDayId: true },
  })
  return item ?? workoutPlanNotFound()
}

export const translateWorkoutPlanError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2002', 'P2003'].includes(error.code)
  )
    throw new AppError(409, WORKOUT_PLAN_CONFLICT)
  throw error
}
