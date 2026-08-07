import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  createWorkoutPlanDay,
  deleteWorkoutPlanDay,
  reorderWorkoutPlanDays,
  updateWorkoutPlanDay,
} from './workout-plan-day.service.js'
import {
  createPlannedExercise,
  deletePlannedExercise,
  reorderPlannedExercises,
  updatePlannedExercise,
} from './workout-plan-exercise.service.js'
import {
  cloneWorkoutPlan,
  createWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlan,
  listWorkoutPlans,
  listWorkoutPlanTemplates,
  updateWorkoutPlan,
} from './workout-plan.service.js'
import type {
  CloneWorkoutPlanInput,
  CreatePlanDayInput,
  CreatePlannedExerciseInput,
  CreateWorkoutPlanInput,
  PlanListQuery,
  ReorderDaysInput,
  ReorderExercisesInput,
  TemplateListQuery,
  UpdatePlanDayInput,
  UpdatePlannedExerciseInput,
  UpdateWorkoutPlanInput,
} from './workout-plan.validation.js'

const appRequest = (request: Request) => request as AppRequest
const userId = (request: AppRequest): string => {
  if (!request.auth) throw new AppError(401, 'Authentication required')
  return request.auth.userId
}
const param = (request: AppRequest, key: string): string =>
  (request.validatedParams as Record<string, string>)[key] ?? ''
const success = (response: Response, data: unknown, status = 200) =>
  response.status(status).json({ success: true, data })

export const listWorkoutPlansController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await listWorkoutPlans(userId(app), app.validatedQuery as PlanListQuery),
  )
}

export const listWorkoutPlanTemplatesController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await listWorkoutPlanTemplates(
      userId(app),
      app.validatedQuery as TemplateListQuery,
    ),
  )
}

export const getWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(response, await getWorkoutPlan(userId(app), param(app, 'planId')))
}

export const createWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await createWorkoutPlan(
      userId(app),
      app.validatedBody as CreateWorkoutPlanInput,
    ),
    201,
  )
}

export const updateWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await updateWorkoutPlan(
      userId(app),
      param(app, 'planId'),
      app.validatedBody as UpdateWorkoutPlanInput,
    ),
  )
}

export const deleteWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  await deleteWorkoutPlan(userId(app), param(app, 'planId'))
  response.json({ success: true, message: 'Workout plan deleted' })
}

export const cloneWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await cloneWorkoutPlan(
      userId(app),
      param(app, 'planId'),
      app.validatedBody as CloneWorkoutPlanInput,
    ),
    201,
  )
}

export const createWorkoutPlanDayController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await createWorkoutPlanDay(
      userId(app),
      param(app, 'planId'),
      app.validatedBody as CreatePlanDayInput,
    ),
    201,
  )
}

export const updateWorkoutPlanDayController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await updateWorkoutPlanDay(
      userId(app),
      param(app, 'dayId'),
      app.validatedBody as UpdatePlanDayInput,
    ),
  )
}

export const deleteWorkoutPlanDayController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await deleteWorkoutPlanDay(userId(app), param(app, 'dayId')),
  )
}

export const reorderWorkoutPlanDaysController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await reorderWorkoutPlanDays(
      userId(app),
      param(app, 'planId'),
      app.validatedBody as ReorderDaysInput,
    ),
  )
}

export const createPlannedExerciseController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await createPlannedExercise(
      userId(app),
      param(app, 'dayId'),
      app.validatedBody as CreatePlannedExerciseInput,
    ),
    201,
  )
}

export const updatePlannedExerciseController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await updatePlannedExercise(
      userId(app),
      param(app, 'planExerciseId'),
      app.validatedBody as UpdatePlannedExerciseInput,
    ),
  )
}

export const deletePlannedExerciseController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await deletePlannedExercise(userId(app), param(app, 'planExerciseId')),
  )
}

export const reorderPlannedExercisesController = async (
  request: Request,
  response: Response,
) => {
  const app = appRequest(request)
  success(
    response,
    await reorderPlannedExercises(
      userId(app),
      param(app, 'dayId'),
      app.validatedBody as ReorderExercisesInput,
    ),
  )
}
