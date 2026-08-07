import { create } from 'zustand'
import {
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerRequest,
} from '../services/auth.service.js'
import { configureAuthSession } from '../services/api-client.js'
import type {
  AuthenticatedUser,
  AuthErrorCode,
  LoginRequest,
  RegisterRequest,
} from '../types/auth.js'

interface AuthState {
  user: AuthenticatedUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  isSubmitting: boolean
  error: AuthErrorCode | null
  initializeAuth: () => Promise<void>
  register: (input: RegisterRequest) => Promise<boolean>
  login: (input: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
}

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  isSubmitting: false,
  error: null,
}

let initializationPromise: Promise<void> | null = null

const isAuthErrorCode = (value: unknown): value is AuthErrorCode =>
  value === 'invalidCredentials' ||
  value === 'emailExists' ||
  value === 'inactive' ||
  value === 'network' ||
  value === 'rateLimited' ||
  value === 'login' ||
  value === 'register'

const getAuthErrorCode = (
  error: unknown,
  fallback: AuthErrorCode,
): AuthErrorCode => {
  if (!(error instanceof Error)) return fallback

  const safeMessageCodes: Record<string, AuthErrorCode> = {
    'Invalid email or password': 'invalidCredentials',
    'An account with this email already exists': 'emailExists',
    'Account is inactive': 'inactive',
  }
  const code = safeMessageCodes[error.message]
  if (code) return code

  return 'code' in error && isAuthErrorCode(error.code) ? error.code : fallback
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  setAccessToken: (accessToken) => {
    set({ accessToken })
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false,
      isSubmitting: false,
      error: null,
    })
  },

  fetchCurrentUser: async () => {
    const user = await fetchCurrentUserRequest()
    set({ user, isAuthenticated: true })
  },

  initializeAuth: async () => {
    initializationPromise ??= (async () => {
      set({ isInitializing: true, error: null })

      try {
        const accessToken = await refreshSessionRequest()
        set({ accessToken })
        await get().fetchCurrentUser()
      } catch {
        set({ user: null, accessToken: null, isAuthenticated: false })
      } finally {
        set({ isInitializing: false })
      }
    })()

    return initializationPromise
  },

  login: async (input) => {
    set({ isSubmitting: true, error: null })

    try {
      const response = await loginRequest(input)
      set({ accessToken: response.data.accessToken })
      await get().fetchCurrentUser()
      return true
    } catch (error) {
      get().clearAuth()
      set({
        error: getAuthErrorCode(error, 'login'),
      })
      return false
    } finally {
      set({ isSubmitting: false })
    }
  },

  register: async (input) => {
    set({ isSubmitting: true, error: null })

    try {
      const response = await registerRequest(input)
      set({ accessToken: response.data.accessToken })
      await get().fetchCurrentUser()
      return true
    } catch (error) {
      get().clearAuth()
      set({
        error: getAuthErrorCode(error, 'register'),
      })
      return false
    } finally {
      set({ isSubmitting: false })
    }
  },

  logout: async () => {
    set({ isSubmitting: true, error: null })
    await logoutRequest()
    get().clearAuth()
  },
}))

const redirectToLogin = (): void => {
  if (window.location.pathname === '/login') {
    return
  }

  window.history.replaceState(null, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (accessToken) => {
    useAuthStore.getState().setAccessToken(accessToken)
  },
  clearAuth: () => {
    useAuthStore.getState().clearAuth()
  },
  onSessionExpired: redirectToLogin,
})

export const resetAuthStoreForTests = (): void => {
  initializationPromise = null
  useAuthStore.setState(initialState)
}
