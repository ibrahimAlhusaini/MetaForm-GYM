import type { Request, Response } from 'express'
import type { AppRequest } from '../../types/request.js'
import { AppError } from '../../utils/app-error.js'
import {
  createAdminWorkoutPlan,
  deleteAdminWorkoutPlan,
  publishAdminWorkoutPlan,
  unpublishAdminWorkoutPlan,
  updateAdminWorkoutPlan,
} from './admin-workout-plan.service.js'
import type {
  CreateAdminWorkoutPlanInput,
  UpdateWorkoutPlanInput,
} from './workout-plan.validation.js'

const context = (request: Request) => request as AppRequest
const adminId = (request: AppRequest): string => {
  if (!request.auth) throw new AppError(401, 'Authentication required')
  return request.auth.userId
}
const planId = (request: AppRequest): string =>
  (request.validatedParams as { planId: string }).planId

export const createAdminWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = context(request)
  response.status(201).json({
    success: true,
    data: await createAdminWorkoutPlan(
      adminId(app),
      app.validatedBody as CreateAdminWorkoutPlanInput,
    ),
  })
}

export const updateAdminWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = context(request)
  response.json({
    success: true,
    data: await updateAdminWorkoutPlan(
      adminId(app),
      planId(app),
      app.validatedBody as UpdateWorkoutPlanInput,
    ),
  })
}

export const publishAdminWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = context(request)
  response.json({
    success: true,
    data: await publishAdminWorkoutPlan(adminId(app), planId(app)),
  })
}

export const unpublishAdminWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = context(request)
  response.json({
    success: true,
    data: await unpublishAdminWorkoutPlan(adminId(app), planId(app)),
  })
}

export const deleteAdminWorkoutPlanController = async (
  request: Request,
  response: Response,
) => {
  const app = context(request)
  await deleteAdminWorkoutPlan(planId(app))
  response.json({ success: true, message: 'System workout plan deleted' })
}
