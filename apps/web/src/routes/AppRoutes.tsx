import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout.js'
import { DashboardPage } from '../features/dashboard/DashboardPage.js'
import { ExerciseDetailPage } from '../features/exercise-library/pages/ExerciseDetailPage.js'
import { ExerciseLibraryPage } from '../features/exercise-library/pages/ExerciseLibraryPage.js'
import { CaloriesCalculatorPage } from '../features/nutrition/pages/CaloriesCalculatorPage.js'
import { WorkoutPlanCreatePage } from '../features/workout-plans/pages/WorkoutPlanCreatePage.js'
import { WorkoutPlanDetailPage } from '../features/workout-plans/pages/WorkoutPlanDetailPage.js'
import { WorkoutPlanEditPage } from '../features/workout-plans/pages/WorkoutPlanEditPage.js'
import { WorkoutPlansPage } from '../features/workout-plans/pages/WorkoutPlansPage.js'
import { MachineFormPage } from '../features/weight-tracker/pages/MachineFormPage.js'
import { MachinesPage } from '../features/weight-tracker/pages/MachinesPage.js'
import { SessionBuilderPage } from '../features/weight-tracker/pages/SessionBuilderPage.js'
import { SessionDetailPage } from '../features/weight-tracker/pages/SessionDetailPage.js'
import { SessionsPage } from '../features/weight-tracker/pages/SessionsPage.js'
import { SourceHistoryPage } from '../features/weight-tracker/pages/SourceHistoryPage.js'
import { WeightTrackerPage } from '../features/weight-tracker/pages/WeightTrackerPage.js'
import { appRouteSegments } from '../config/navigation.config.js'
import { AppNotFoundPage } from '../pages/AppNotFoundPage.js'
import { FeaturePlaceholderPage } from '../pages/FeaturePlaceholderPage.js'
import { LoginPage } from '../pages/LoginPage.js'
import { NotFoundPage } from '../pages/NotFoundPage.js'
import { RegisterPage } from '../pages/RegisterPage.js'
import { useAuthStore } from '../store/auth.store.js'
import { GuestRoute } from './GuestRoute.js'
import { ProtectedRoute } from './ProtectedRoute.js'

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
          <Route
            path={appRouteSegments.aiCoach}
            element={<FeaturePlaceholderPage navigationId="aiCoach" />}
          />
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
          <Route
            path={appRouteSegments.profile}
            element={<FeaturePlaceholderPage navigationId="profile" />}
          />
          <Route path="*" element={<AppNotFoundPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
