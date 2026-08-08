import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes.js'
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js'
import { weightTrackerRouter } from '../modules/weight-tracker/weight-tracker.routes.js'
import { exerciseLibraryRouter } from '../modules/exercise-library/exercise-library.routes.js'
import { adminExerciseRouter } from '../modules/exercise-library/admin-exercise.routes.js'
import { nutritionRouter } from '../modules/nutrition/nutrition.routes.js'
import { workoutPlanRouter } from '../modules/workout-plans/workout-plan.routes.js'
import { adminWorkoutPlanRouter } from '../modules/workout-plans/admin-workout-plan.routes.js'
import { profileRouter } from '../modules/profile/profile.routes.js'
import { aiCoachRouter } from '../modules/ai-coach/ai-coach.routes.js'
import { healthRouter } from './health.routes.js'
import { bodyMeasurementRouter } from '../modules/body-measurements/body-measurement.routes.js'
import { bodyWeightPredictionRouter } from '../modules/body-weight-prediction/body-weight-prediction.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/body-measurements', bodyMeasurementRouter)
apiRouter.use('/body-weight/prediction', bodyWeightPredictionRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/weight-tracker', weightTrackerRouter)
apiRouter.use('/exercises', exerciseLibraryRouter)
apiRouter.use('/admin/exercises', adminExerciseRouter)
apiRouter.use('/nutrition', nutritionRouter)
apiRouter.use('/workout-plans', workoutPlanRouter)
apiRouter.use('/admin/workout-plans', adminWorkoutPlanRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/ai-coach', aiCoachRouter)
