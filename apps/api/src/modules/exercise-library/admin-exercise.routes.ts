import { Router } from 'express'
import { UserRole } from '../../generated/prisma/client.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { authenticate } from '../../middlewares/authenticate.js'
import { authorizeRole } from '../../middlewares/authorize-role.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate-request.js'
import {
  createAdminExerciseController,
  deleteAdminExerciseController,
  getAdminExerciseController,
  listAdminExercisesController,
  publishAdminExerciseController,
  unpublishAdminExerciseController,
  updateAdminExerciseController,
} from './admin-exercise.controller.js'
import {
  adminExerciseListQuerySchema,
  createExerciseSchema,
  exerciseIdParamsSchema,
  updateExerciseSchema,
} from './exercise-library.validation.js'

export const adminExerciseRouter = Router()
adminExerciseRouter.use(asyncHandler(authenticate))
adminExerciseRouter.use(authorizeRole(UserRole.ADMIN))
adminExerciseRouter.post(
  '/',
  validateBody(createExerciseSchema),
  asyncHandler(createAdminExerciseController),
)
adminExerciseRouter.get(
  '/',
  validateQuery(adminExerciseListQuerySchema),
  asyncHandler(listAdminExercisesController),
)
adminExerciseRouter.get(
  '/:exerciseId',
  validateParams(exerciseIdParamsSchema),
  asyncHandler(getAdminExerciseController),
)
adminExerciseRouter.patch(
  '/:exerciseId',
  validateParams(exerciseIdParamsSchema),
  validateBody(updateExerciseSchema),
  asyncHandler(updateAdminExerciseController),
)
adminExerciseRouter.post(
  '/:exerciseId/publish',
  validateParams(exerciseIdParamsSchema),
  asyncHandler(publishAdminExerciseController),
)
adminExerciseRouter.post(
  '/:exerciseId/unpublish',
  validateParams(exerciseIdParamsSchema),
  asyncHandler(unpublishAdminExerciseController),
)
adminExerciseRouter.delete(
  '/:exerciseId',
  validateParams(exerciseIdParamsSchema),
  asyncHandler(deleteAdminExerciseController),
)
