import { prisma } from '../../../config/prisma.js'
import { getProfileSummary } from '../../profile/profile.service.js'
import {
  visiblePlanWhere,
  workoutPlanNotFound,
} from '../../workout-plans/workout-plan.visibility.js'

export const buildPlanContext = async (
  userId: string,
  workoutPlanId: string,
) => {
  const [plan, profile] = await Promise.all([
    prisma.workoutPlan.findFirst({
      where: { id: workoutPlanId, ...visiblePlanWhere(userId) },
      select: {
        name: true,
        difficultyLevel: true,
        days: {
          orderBy: { orderIndex: 'asc' },
          select: {
            isRestDay: true,
            exercises: {
              orderBy: { orderIndex: 'asc' },
              select: {
                sets: true,
                exercise: { select: { name: true, primaryMuscle: true } },
              },
            },
          },
        },
      },
    }),
    getProfileSummary(userId),
  ])
  if (!plan) return workoutPlanNotFound()
  const trainingDays = plan.days.filter((day) => !day.isRestDay)
  const exercises = trainingDays.flatMap((day) => day.exercises)
  const names = exercises.map((item) => item.exercise.name)
  const muscleDistribution = exercises.reduce<Record<string, number>>(
    (result, item) => {
      result[item.exercise.primaryMuscle] =
        (result[item.exercise.primaryMuscle] ?? 0) + 1
      return result
    },
    {},
  )
  return {
    plan: { name: plan.name, difficultyLevel: plan.difficultyLevel },
    fitnessGoal: profile.fitnessGoal,
    structure: {
      trainingDays: trainingDays.length,
      restDays: plan.days.length - trainingDays.length,
      totalExercises: exercises.length,
      totalPrescribedSets: exercises.reduce(
        (total, item) => total + (item.sets ?? 0),
        0,
      ),
      muscleDistribution,
      repeatedExerciseCount: names.length - new Set(names).size,
      emptyTrainingDays: trainingDays.filter(
        (day) => day.exercises.length === 0,
      ).length,
      denseTrainingDays: trainingDays.filter((day) => day.exercises.length > 10)
        .length,
    },
    insufficientData: trainingDays.length === 0 || exercises.length === 0,
  }
}
