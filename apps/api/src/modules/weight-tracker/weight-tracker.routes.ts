import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  createMachineController,
  deleteMachineController,
  getMachineController,
  listMachinesController,
  updateMachineController,
} from './machine.controller.js'
import {
  completeSessionController,
  createSessionController,
  createSessionWithEntriesController,
  deleteSessionController,
  getSessionController,
  listSessionsController,
  updateSessionController,
} from './session.controller.js'
import {
  createLogController,
  deleteLogController,
  reorderLogsController,
  updateLogController,
} from './log.controller.js'
import {
  createSetController,
  deleteSetController,
  reorderSetsController,
  updateSetController,
} from './set.controller.js'
import { getSourceHistoryController } from './history.controller.js'
import { getStrengthPredictionController } from '../strength-prediction/strength-prediction.controller.js'
import {
  completeSessionSchema,
  createLogSchema,
  createMachineSchema,
  createSessionSchema,
  createSessionWithEntriesSchema,
  createSetSchema,
  historyParamsSchema,
  historyQuerySchema,
  idParamsSchema,
  listMachinesQuerySchema,
  listSessionsQuerySchema,
  reorderLogsSchema,
  reorderSetsSchema,
  updateLogSchema,
  updateMachineSchema,
  updateSessionSchema,
  updateSetSchema,
} from './weight-tracker.validation.js'

export const weightTrackerRouter = Router()
weightTrackerRouter.use(asyncHandler(authenticate))

weightTrackerRouter.post(
  '/machines',
  validateBody(createMachineSchema),
  asyncHandler(createMachineController),
)
weightTrackerRouter.get(
  '/sources/:sourceType/:sourceId/strength-prediction',
  validateParams(historyParamsSchema),
  asyncHandler(getStrengthPredictionController),
)
weightTrackerRouter.get(
  '/machines',
  validateQuery(listMachinesQuerySchema),
  asyncHandler(listMachinesController),
)
weightTrackerRouter.get(
  '/machines/:machineId',
  validateParams(idParamsSchema('machineId')),
  asyncHandler(getMachineController),
)
weightTrackerRouter.patch(
  '/machines/:machineId',
  validateParams(idParamsSchema('machineId')),
  validateBody(updateMachineSchema),
  asyncHandler(updateMachineController),
)
weightTrackerRouter.delete(
  '/machines/:machineId',
  validateParams(idParamsSchema('machineId')),
  asyncHandler(deleteMachineController),
)

weightTrackerRouter.post(
  '/sessions/with-entries',
  validateBody(createSessionWithEntriesSchema),
  asyncHandler(createSessionWithEntriesController),
)
weightTrackerRouter.post(
  '/sessions',
  validateBody(createSessionSchema),
  asyncHandler(createSessionController),
)
weightTrackerRouter.get(
  '/sessions',
  validateQuery(listSessionsQuerySchema),
  asyncHandler(listSessionsController),
)
weightTrackerRouter.get(
  '/sessions/:sessionId',
  validateParams(idParamsSchema('sessionId')),
  asyncHandler(getSessionController),
)
weightTrackerRouter.patch(
  '/sessions/:sessionId',
  validateParams(idParamsSchema('sessionId')),
  validateBody(updateSessionSchema),
  asyncHandler(updateSessionController),
)
weightTrackerRouter.post(
  '/sessions/:sessionId/complete',
  validateParams(idParamsSchema('sessionId')),
  validateBody(completeSessionSchema),
  asyncHandler(completeSessionController),
)
weightTrackerRouter.delete(
  '/sessions/:sessionId',
  validateParams(idParamsSchema('sessionId')),
  asyncHandler(deleteSessionController),
)

weightTrackerRouter.post(
  '/sessions/:sessionId/logs/reorder',
  validateParams(idParamsSchema('sessionId')),
  validateBody(reorderLogsSchema),
  asyncHandler(reorderLogsController),
)
weightTrackerRouter.post(
  '/sessions/:sessionId/logs',
  validateParams(idParamsSchema('sessionId')),
  validateBody(createLogSchema),
  asyncHandler(createLogController),
)
weightTrackerRouter.patch(
  '/logs/:logId',
  validateParams(idParamsSchema('logId')),
  validateBody(updateLogSchema),
  asyncHandler(updateLogController),
)
weightTrackerRouter.delete(
  '/logs/:logId',
  validateParams(idParamsSchema('logId')),
  asyncHandler(deleteLogController),
)

weightTrackerRouter.post(
  '/logs/:logId/sets/reorder',
  validateParams(idParamsSchema('logId')),
  validateBody(reorderSetsSchema),
  asyncHandler(reorderSetsController),
)
weightTrackerRouter.post(
  '/logs/:logId/sets',
  validateParams(idParamsSchema('logId')),
  validateBody(createSetSchema),
  asyncHandler(createSetController),
)
weightTrackerRouter.patch(
  '/sets/:setId',
  validateParams(idParamsSchema('setId')),
  validateBody(updateSetSchema),
  asyncHandler(updateSetController),
)
weightTrackerRouter.delete(
  '/sets/:setId',
  validateParams(idParamsSchema('setId')),
  asyncHandler(deleteSetController),
)

weightTrackerRouter.get(
  '/sources/:sourceType/:sourceId/history',
  validateParams(historyParamsSchema),
  validateQuery(historyQuerySchema),
  asyncHandler(getSourceHistoryController),
)
