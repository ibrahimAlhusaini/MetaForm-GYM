import type { Prisma } from '../../generated/prisma/client.js'
import { planDetailSelect } from './workout-plan.mapper.js'
import {
  visiblePlanWhere,
  workoutPlanNotFound,
} from './workout-plan.visibility.js'
import type { CloneWorkoutPlanInput } from './workout-plan.validation.js'
import { validatePublishedExerciseIds } from './workout-plan.exercise-validation.js'

type Client = Prisma.TransactionClient

const cloneSelect = {
  name: true,
  description: true,
  difficultyLevel: true,
  days: {
    orderBy: { orderIndex: 'asc' as const },
    select: {
      dayOfWeek: true,
      name: true,
      notes: true,
      isRestDay: true,
      orderIndex: true,
      exercises: {
        orderBy: { orderIndex: 'asc' as const },
        select: {
          exerciseId: true,
          sets: true,
          reps: true,
          restSeconds: true,
          notes: true,
          orderIndex: true,
        },
      },
    },
  },
} satisfies Prisma.WorkoutPlanSelect

export const clonePlanAggregate = async (
  client: Client,
  userId: string,
  planId: string,
  input: CloneWorkoutPlanInput,
) => {
  const source = await client.workoutPlan.findFirst({
    where: { id: planId, ...visiblePlanWhere(userId) },
    select: cloneSelect,
  })
  if (!source) return workoutPlanNotFound()
  await validatePublishedExerciseIds(
    client,
    source.days.flatMap((day) =>
      day.exercises.map((exercise) => exercise.exerciseId),
    ),
  )
  return client.workoutPlan.create({
    data: {
      userId,
      name: input.name ?? `${source.name} Copy`,
      description: source.description,
      difficultyLevel: source.difficultyLevel,
      isTemplate: false,
      isPublic: false,
      days: {
        create: source.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          notes: day.notes,
          isRestDay: day.isRestDay,
          orderIndex: day.orderIndex,
          exercises: { create: day.exercises },
        })),
      },
    },
    select: planDetailSelect,
  })
}
