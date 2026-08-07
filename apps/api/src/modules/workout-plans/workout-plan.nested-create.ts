import type { Prisma } from '../../generated/prisma/client.js'
import { planDetailSelect } from './workout-plan.mapper.js'
import { validatePublishedExerciseIds } from './workout-plan.exercise-validation.js'
import type {
  CreateAdminWorkoutPlanInput,
  CreateWorkoutPlanInput,
} from './workout-plan.validation.js'

type Client = Prisma.TransactionClient
type NestedPlanInput = CreateWorkoutPlanInput | CreateAdminWorkoutPlanInput

export const createPlanAggregate = async (
  client: Client,
  userId: string | null,
  input: NestedPlanInput,
) => {
  await validatePublishedExerciseIds(
    client,
    input.days.flatMap((day) =>
      day.exercises.map((exercise) => exercise.exerciseId),
    ),
  )
  return client.workoutPlan.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      difficultyLevel: input.difficultyLevel,
      isTemplate: input.isTemplate,
      isPublic: 'isPublic' in input ? input.isPublic : false,
      days: {
        create: input.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name ?? null,
          notes: day.notes ?? null,
          isRestDay: day.isRestDay,
          orderIndex: day.orderIndex,
          exercises: {
            create: day.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              sets: exercise.sets ?? null,
              reps: exercise.reps ?? null,
              restSeconds: exercise.restSeconds ?? null,
              notes: exercise.notes ?? null,
              orderIndex: exercise.orderIndex,
            })),
          },
        })),
      },
    },
    select: planDetailSelect,
  })
}
