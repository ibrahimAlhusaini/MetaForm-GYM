import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes.js'
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js'
import { weightTrackerRouter } from '../modules/weight-tracker/weight-tracker.routes.js'
import { healthRouter } from './health.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/weight-tracker', weightTrackerRouter)
