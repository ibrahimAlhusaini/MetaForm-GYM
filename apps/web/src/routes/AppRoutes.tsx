import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout.js'
import { appRouteSegments } from '../config/navigation.config.js'
import { AppNotFoundPage } from '../pages/AppNotFoundPage.js'
import { LoginPage } from '../pages/LoginPage.js'
import { NotFoundPage } from '../pages/NotFoundPage.js'
import { RegisterPage } from '../pages/RegisterPage.js'
import { useAuthStore } from '../store/auth.store.js'
import { GuestRoute } from './GuestRoute.js'
import { ProtectedRoute } from './ProtectedRoute.js'

const DashboardPage = lazy(async () => ({
  default: (await import('../features/dashboard/DashboardPage.js'))
    .DashboardPage,
}))
const AiCoachPage = lazy(async () => ({
  default: (await import('../features/ai-coach/pages/AiCoachPage.js'))
    .AiCoachPage,
}))
const AiCoachSessionPage = lazy(async () => ({
  default: (await import('../features/ai-coach/pages/AiCoachSessionPage.js'))
    .AiCoachSessionPage,
}))
const ExerciseDetailPage = lazy(async () => ({
  default: (
    await import('../features/exercise-library/pages/ExerciseDetailPage.js')
  ).ExerciseDetailPage,
}))
const ExerciseLibraryPage = lazy(async () => ({
  default: (
    await import('../features/exercise-library/pages/ExerciseLibraryPage.js')
  ).ExerciseLibraryPage,
}))
const CaloriesCalculatorPage = lazy(async () => ({
  default: (
    await import('../features/nutrition/pages/CaloriesCalculatorPage.js')
  ).CaloriesCalculatorPage,
}))
const ProfilePage = lazy(async () => ({
  default: (await import('../features/profile/pages/ProfilePage.js'))
    .ProfilePage,
}))
const WorkoutPlanCreatePage = lazy(async () => ({
  default: (
    await import('../features/workout-plans/pages/WorkoutPlanCreatePage.js')
  ).WorkoutPlanCreatePage,
}))
const WorkoutPlanDetailPage = lazy(async () => ({
  default: (
    await import('../features/workout-plans/pages/WorkoutPlanDetailPage.js')
  ).WorkoutPlanDetailPage,
}))
const WorkoutPlanEditPage = lazy(async () => ({
  default: (
    await import('../features/workout-plans/pages/WorkoutPlanEditPage.js')
  ).WorkoutPlanEditPage,
}))
const WorkoutPlansPage = lazy(async () => ({
  default: (await import('../features/workout-plans/pages/WorkoutPlansPage.js'))
    .WorkoutPlansPage,
}))
const MachineFormPage = lazy(async () => ({
  default: (await import('../features/weight-tracker/pages/MachineFormPage.js'))
    .MachineFormPage,
}))
const MachinesPage = lazy(async () => ({
  default: (await import('../features/weight-tracker/pages/MachinesPage.js'))
    .MachinesPage,
}))
const SessionBuilderPage = lazy(async () => ({
  default: (
    await import('../features/weight-tracker/pages/SessionBuilderPage.js')
  ).SessionBuilderPage,
}))
const SessionDetailPage = lazy(async () => ({
  default: (
    await import('../features/weight-tracker/pages/SessionDetailPage.js')
  ).SessionDetailPage,
}))
const SessionsPage = lazy(async () => ({
  default: (await import('../features/weight-tracker/pages/SessionsPage.js'))
    .SessionsPage,
}))
const SourceHistoryPage = lazy(async () => ({
  default: (
    await import('../features/weight-tracker/pages/SourceHistoryPage.js')
  ).SourceHistoryPage,
}))
const WeightTrackerPage = lazy(async () => ({
  default: (
    await import('../features/weight-tracker/pages/WeightTrackerPage.js')
  ).WeightTrackerPage,
}))
const BodyWeightPage = lazy(async () => ({
  default: (await import('../features/body-weight/pages/BodyWeightPage.js'))
    .BodyWeightPage,
}))

function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return <Navigate to={isAuthenticated ? '/app' : '/login'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path={appRouteSegments.weights}>
            <Route index element={<WeightTrackerPage />} />
            <Route path="body-weight" element={<BodyWeightPage />} />
            <Route path="machines" element={<MachinesPage />} />
            <Route path="machines/new" element={<MachineFormPage />} />
            <Route path="machines/:machineId" element={<MachineFormPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/new" element={<SessionBuilderPage />} />
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route
              path="history/:sourceType/:sourceId"
              element={<SourceHistoryPage />}
            />
          </Route>
          <Route path={appRouteSegments.exercises}>
            <Route index element={<ExerciseLibraryPage />} />
            <Route path=":exerciseId" element={<ExerciseDetailPage />} />
          </Route>
          <Route path={appRouteSegments.aiCoach}>
            <Route index element={<AiCoachPage />} />
            <Route
              path="sessions/:sessionId"
              element={<AiCoachSessionPage />}
            />
          </Route>
          <Route
            path={appRouteSegments.calories}
            element={<CaloriesCalculatorPage />}
          />
          <Route path={appRouteSegments.plans}>
            <Route index element={<WorkoutPlansPage />} />
            <Route path="new" element={<WorkoutPlanCreatePage />} />
            <Route path=":planId" element={<WorkoutPlanDetailPage />} />
            <Route path=":planId/edit" element={<WorkoutPlanEditPage />} />
          </Route>
          <Route path={appRouteSegments.profile} element={<ProfilePage />} />
          <Route path="*" element={<AppNotFoundPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
