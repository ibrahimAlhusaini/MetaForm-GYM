import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from '../../utils/pagination.js'
import { clonePlanAggregate } from './workout-plan.clone.js'
import { createPlanAggregate } from './workout-plan.nested-create.js'
import {
  mapPlanDetail,
  mapPlanSummary,
  planDetailSelect,
  planSummarySelect,
} from './workout-plan.mapper.js'
import {
  planListWhere,
  planOrderBy,
  templateListWhere,
} from './workout-plan.query.js'
import {
  requireOwnedPlan,
  translateWorkoutPlanError,
  visiblePlanWhere,
  workoutPlanNotFound,
} from './workout-plan.visibility.js'
import type {
  CloneWorkoutPlanInput,
  CreateWorkoutPlanInput,
  PlanListQuery,
  TemplateListQuery,
  UpdateWorkoutPlanInput,
} from './workout-plan.validation.js'

export const listWorkoutPlans = async (
  userId: string,
  query: PlanListQuery,
) => {
  const where = planListWhere(userId, query)
  const [totalItems, rows] = await prisma.$transaction([
    prisma.workoutPlan.count({ where }),
    prisma.workoutPlan.findMany({
      where,
      select: planSummarySelect,
      orderBy: planOrderBy(query.sortBy, query.sortOrder),
      skip: paginationSkip(query),
      take: query.limit,
    }),
  ])
  return {
    items: rows.map((row) => mapPlanSummary(row, userId)),
    pagination: paginationMetadata(query, totalItems),
  }
}

export const listWorkoutPlanTemplates = async (
  userId: string,
  query: TemplateListQuery,
) => {
  const where = templateListWhere(userId, query)
  const [totalItems, rows] = await prisma.$transaction([
    prisma.workoutPlan.count({ where }),
    prisma.workoutPlan.findMany({
      where,
      select: planSummarySelect,
      orderBy: planOrderBy(query.sortBy, query.sortOrder),
      skip: paginationSkip(query),
      take: query.limit,
    }),
  ])
  return {
    items: rows.map((row) => mapPlanSummary(row, userId)),
    pagination: paginationMetadata(query, totalItems),
  }
}

export const getWorkoutPlan = async (userId: string, planId: string) => {
  const row = await prisma.workoutPlan.findFirst({
    where: { id: planId, ...visiblePlanWhere(userId) },
    select: planDetailSelect,
  })
  return row ? mapPlanDetail(row, userId) : workoutPlanNotFound()
}

export const loadWorkoutPlanAfterMutation = async (
  userId: string,
  planId: string,
) => {
  const row = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    select: planDetailSelect,
  })
  return row ? mapPlanDetail(row, userId) : workoutPlanNotFound()
}

export const createWorkoutPlan = async (
  userId: string,
  input: CreateWorkoutPlanInput,
) => {
  try {
    const row = await prisma.$transaction((client) =>
      createPlanAggregate(client, userId, input),
    )
    return mapPlanDetail(row, userId)
  } catch (error) {
    return translateWorkoutPlanError(error)
  }
}

export const workoutPlanUpdateData = (
  input: UpdateWorkoutPlanInput,
): Prisma.WorkoutPlanUpdateInput => {
  const data: Prisma.WorkoutPlanUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description
  if (input.difficultyLevel !== undefined)
    data.difficultyLevel = input.difficultyLevel
  if (input.isTemplate !== undefined) data.isTemplate = input.isTemplate
  return data
}

export const updateWorkoutPlan = async (
  userId: string,
  planId: string,
  input: UpdateWorkoutPlanInput,
) => {
  await prisma.$transaction(async (client) => {
    await requireOwnedPlan(client, userId, planId)
    await client.workoutPlan.update({
      where: { id: planId },
      data: workoutPlanUpdateData(input),
    })
  })
  return loadWorkoutPlanAfterMutation(userId, planId)
}

export const deleteWorkoutPlan = async (userId: string, planId: string) => {
  try {
    await prisma.$transaction(async (client) => {
      await requireOwnedPlan(client, userId, planId)
      await client.workoutPlan.delete({ where: { id: planId } })
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    translateWorkoutPlanError(error)
  }
}

export const cloneWorkoutPlan = async (
  userId: string,
  planId: string,
  input: CloneWorkoutPlanInput,
) => {
  try {
    const row = await prisma.$transaction((client) =>
      clonePlanAggregate(client, userId, planId, input),
    )
    return mapPlanDetail(row, userId)
  } catch (error) {
    return translateWorkoutPlanError(error)
  }
}
