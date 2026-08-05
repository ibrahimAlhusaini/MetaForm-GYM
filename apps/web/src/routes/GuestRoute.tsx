import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../store/auth.store.js'

export function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />
}
