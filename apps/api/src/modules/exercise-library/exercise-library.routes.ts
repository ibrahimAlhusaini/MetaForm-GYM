import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateParams,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  getExerciseBySlugController,
  getExerciseController,
  getExerciseFilterOptionsController,
  listExerciseOptionsController,
  listExercisesController,
} from './exercise-library.controller.js'
import {
  exerciseIdParamsSchema,
  exerciseOptionsQuerySchema,
  exerciseSlugParamsSchema,
  publicExerciseListQuerySchema,
} from './exercise-library.validation.js'

export const exerciseLibraryRouter = Router()
exerciseLibraryRouter.use(asyncHandler(authenticate))
exerciseLibraryRouter.get('/filter-options', getExerciseFilterOptionsController)
exerciseLibraryRouter.get(
  '/options',
  validateQuery(exerciseOptionsQuerySchema),
  asyncHandler(listExerciseOptionsController),
)
exerciseLibraryRouter.get(
  '/slug/:slug',
  validateParams(exerciseSlugParamsSchema),
  asyncHandler(getExerciseBySlugController),
)
exerciseLibraryRouter.get(
  '/:exerciseId',
  validateParams(exerciseIdParamsSchema),
  asyncHandler(getExerciseController),
)
exerciseLibraryRouter.get(
  '/',
  validateQuery(publicExerciseListQuerySchema),
  asyncHandler(listExercisesController),
)
