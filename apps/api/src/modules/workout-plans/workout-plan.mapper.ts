import type { Prisma } from '../../generated/prisma/client.js'
import type {
  WorkoutPlanDetail,
  WorkoutPlanOwnershipType,
  WorkoutPlanStatistics,
  WorkoutPlanSummary,
  WorkoutPlanTemplateType,
} from '@metaform/shared-types'

const baseSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  difficultyLevel: true,
  isTemplate: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkoutPlanSelect

export const planSummarySelect = {
  ...baseSelect,
  days: {
    select: {
      isRestDay: true,
      _count: { select: { exercises: true } },
    },
  },
} satisfies Prisma.WorkoutPlanSelect

export const planDetailSelect = {
  ...baseSelect,
  days: {
    orderBy: [{ orderIndex: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      dayOfWeek: true,
      name: true,
      notes: true,
      isRestDay: true,
      orderIndex: true,
      exercises: {
        orderBy: [{ orderIndex: 'asc' as const }, { id: 'asc' as const }],
        select: {
          id: true,
          sets: true,
          reps: true,
          restSeconds: true,
          notes: true,
          orderIndex: true,
          exercise: {
            select: {
              id: true,
              name: true,
              primaryMuscle: true,
              muscleSubgroup: true,
              equipmentType: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WorkoutPlanSelect

type SummaryRow = Prisma.WorkoutPlanGetPayload<{
  select: typeof planSummarySelect
}>
type DetailRow = Prisma.WorkoutPlanGetPayload<{
  select: typeof planDetailSelect
}>

const ownershipType = (
  planUserId: string | null,
  viewerUserId: string,
): WorkoutPlanOwnershipType => {
  if (planUserId === null) return 'SYSTEM'
  return planUserId === viewerUserId ? 'USER' : 'PUBLIC'
}

const templateType = (
  isTemplate: boolean,
  planUserId: string | null,
): WorkoutPlanTemplateType | null => {
  if (!isTemplate) return null
  return planUserId === null ? 'SYSTEM_TEMPLATE' : 'USER_TEMPLATE'
}

const statistics = (
  days: readonly { isRestDay: boolean; exerciseCount: number }[],
): WorkoutPlanStatistics => ({
  totalDays: days.length,
  trainingDays: days.filter((day) => !day.isRestDay).length,
  restDays: days.filter((day) => day.isRestDay).length,
  totalExercises: days.reduce((sum, day) => sum + day.exerciseCount, 0),
})

const summaryBase = (
  row: Omit<SummaryRow, 'days'>,
  viewerUserId: string,
  planStatistics: WorkoutPlanStatistics,
): WorkoutPlanSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  difficultyLevel: row.difficultyLevel,
  isTemplate: row.isTemplate,
  isPublic: row.isPublic,
  ownershipType: ownershipType(row.userId, viewerUserId),
  templateType: templateType(row.isTemplate, row.userId),
  ...planStatistics,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const mapPlanSummary = (
  row: SummaryRow,
  viewerUserId: string,
): WorkoutPlanSummary =>
  summaryBase(
    row,
    viewerUserId,
    statistics(
      row.days.map((day) => ({
        isRestDay: day.isRestDay,
        exerciseCount: day._count.exercises,
      })),
    ),
  )

export const mapPlanDetail = (
  row: DetailRow,
  viewerUserId: string,
): WorkoutPlanDetail => ({
  ...summaryBase(
    row,
    viewerUserId,
    statistics(
      row.days.map((day) => ({
        isRestDay: day.isRestDay,
        exerciseCount: day.exercises.length,
      })),
    ),
  ),
  days: row.days.map((day) => ({
    id: day.id,
    dayOfWeek: day.dayOfWeek,
    name: day.name,
    notes: day.notes,
    isRestDay: day.isRestDay,
    orderIndex: day.orderIndex,
    exercises: day.exercises.map((item) => ({
      id: item.id,
      exercise: item.exercise,
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes,
      orderIndex: item.orderIndex,
    })),
  })),
})
