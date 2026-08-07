import { Router } from 'express'
import { UserRole } from '../../generated/prisma/client.js'
import { authenticate } from '../../middlewares/authenticate.js'
import { authorizeRole } from '../../middlewares/authorize-role.js'
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  createAdminWorkoutPlanController,
  deleteAdminWorkoutPlanController,
  publishAdminWorkoutPlanController,
  unpublishAdminWorkoutPlanController,
  updateAdminWorkoutPlanController,
} from './admin-workout-plan.controller.js'
import {
  createAdminWorkoutPlanSchema,
  planIdParamsSchema,
  updateAdminWorkoutPlanSchema,
} from './workout-plan.validation.js'

export const adminWorkoutPlanRouter = Router()
adminWorkoutPlanRouter.use(asyncHandler(authenticate))
adminWorkoutPlanRouter.use(authorizeRole(UserRole.ADMIN))

adminWorkoutPlanRouter.post(
  '/',
  validateBody(createAdminWorkoutPlanSchema),
  asyncHandler(createAdminWorkoutPlanController),
)
adminWorkoutPlanRouter.patch(
  '/:planId',
  validateParams(planIdParamsSchema),
  validateBody(updateAdminWorkoutPlanSchema),
  asyncHandler(updateAdminWorkoutPlanController),
)
adminWorkoutPlanRouter.delete(
  '/:planId',
  validateParams(planIdParamsSchema),
  asyncHandler(deleteAdminWorkoutPlanController),
)
adminWorkoutPlanRouter.post(
  '/:planId/publish',
  validateParams(planIdParamsSchema),
  asyncHandler(publishAdminWorkoutPlanController),
)
adminWorkoutPlanRouter.post(
  '/:planId/unpublish',
  validateParams(planIdParamsSchema),
  asyncHandler(unpublishAdminWorkoutPlanController),
)
