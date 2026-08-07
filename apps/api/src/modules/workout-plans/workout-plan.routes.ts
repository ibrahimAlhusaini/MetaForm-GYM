import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  cloneWorkoutPlanController,
  createPlannedExerciseController,
  createWorkoutPlanController,
  createWorkoutPlanDayController,
  deletePlannedExerciseController,
  deleteWorkoutPlanController,
  deleteWorkoutPlanDayController,
  getWorkoutPlanController,
  listWorkoutPlansController,
  listWorkoutPlanTemplatesController,
  reorderPlannedExercisesController,
  reorderWorkoutPlanDaysController,
  updatePlannedExerciseController,
  updateWorkoutPlanController,
  updateWorkoutPlanDayController,
} from './workout-plan.controller.js'
import {
  cloneWorkoutPlanSchema,
  createPlanDaySchema,
  createPlannedExerciseSchema,
  createWorkoutPlanSchema,
  dayIdParamsSchema,
  planExerciseIdParamsSchema,
  planIdParamsSchema,
  planListQuerySchema,
  reorderDaysSchema,
  reorderExercisesSchema,
  templateListQuerySchema,
  updatePlanDaySchema,
  updatePlannedExerciseSchema,
  updateWorkoutPlanSchema,
} from './workout-plan.validation.js'

export const workoutPlanRouter = Router()
workoutPlanRouter.use(asyncHandler(authenticate))

workoutPlanRouter.get(
  '/',
  validateQuery(planListQuerySchema),
  asyncHandler(listWorkoutPlansController),
)
workoutPlanRouter.get(
  '/templates',
  validateQuery(templateListQuerySchema),
  asyncHandler(listWorkoutPlanTemplatesController),
)
workoutPlanRouter.post(
  '/',
  validateBody(createWorkoutPlanSchema),
  asyncHandler(createWorkoutPlanController),
)
workoutPlanRouter.get(
  '/:planId',
  validateParams(planIdParamsSchema),
  asyncHandler(getWorkoutPlanController),
)
workoutPlanRouter.patch(
  '/:planId',
  validateParams(planIdParamsSchema),
  validateBody(updateWorkoutPlanSchema),
  asyncHandler(updateWorkoutPlanController),
)
workoutPlanRouter.delete(
  '/:planId',
  validateParams(planIdParamsSchema),
  asyncHandler(deleteWorkoutPlanController),
)
workoutPlanRouter.post(
  '/:planId/clone',
  validateParams(planIdParamsSchema),
  validateBody(cloneWorkoutPlanSchema),
  asyncHandler(cloneWorkoutPlanController),
)

workoutPlanRouter.post(
  '/:planId/days',
  validateParams(planIdParamsSchema),
  validateBody(createPlanDaySchema),
  asyncHandler(createWorkoutPlanDayController),
)
workoutPlanRouter.post(
  '/:planId/days/reorder',
  validateParams(planIdParamsSchema),
  validateBody(reorderDaysSchema),
  asyncHandler(reorderWorkoutPlanDaysController),
)
workoutPlanRouter.patch(
  '/days/:dayId',
  validateParams(dayIdParamsSchema),
  validateBody(updatePlanDaySchema),
  asyncHandler(updateWorkoutPlanDayController),
)
workoutPlanRouter.delete(
  '/days/:dayId',
  validateParams(dayIdParamsSchema),
  asyncHandler(deleteWorkoutPlanDayController),
)

workoutPlanRouter.post(
  '/days/:dayId/exercises',
  validateParams(dayIdParamsSchema),
  validateBody(createPlannedExerciseSchema),
  asyncHandler(createPlannedExerciseController),
)
workoutPlanRouter.post(
  '/days/:dayId/exercises/reorder',
  validateParams(dayIdParamsSchema),
  validateBody(reorderExercisesSchema),
  asyncHandler(reorderPlannedExercisesController),
)
workoutPlanRouter.patch(
  '/exercises/:planExerciseId',
  validateParams(planExerciseIdParamsSchema),
  validateBody(updatePlannedExerciseSchema),
  asyncHandler(updatePlannedExerciseController),
)
workoutPlanRouter.delete(
  '/exercises/:planExerciseId',
  validateParams(planExerciseIdParamsSchema),
  asyncHandler(deletePlannedExerciseController),
)
