import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout.js'
import { DashboardPage } from '../features/dashboard/DashboardPage.js'
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
          <Route
            path={appRouteSegments.weights}
            element={<FeaturePlaceholderPage navigationId="weights" />}
          />
          <Route
            path={appRouteSegments.exercises}
            element={<FeaturePlaceholderPage navigationId="exercises" />}
          />
          <Route
            path={appRouteSegments.aiCoach}
            element={<FeaturePlaceholderPage navigationId="aiCoach" />}
          />
          <Route
            path={appRouteSegments.calories}
            element={<FeaturePlaceholderPage navigationId="calories" />}
          />
          <Route
            path={appRouteSegments.plans}
            element={<FeaturePlaceholderPage navigationId="plans" />}
          />
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
