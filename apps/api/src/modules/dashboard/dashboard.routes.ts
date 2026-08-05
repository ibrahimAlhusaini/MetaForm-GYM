import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { getDashboardSummaryController } from './dashboard.controller.js'

export const dashboardRouter = Router()

dashboardRouter.get(
  '/summary',
  asyncHandler(authenticate),
  asyncHandler(getDashboardSummaryController),
)
