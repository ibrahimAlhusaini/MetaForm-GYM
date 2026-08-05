import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { refreshResponseSchema } from '../types/auth.js'

interface AuthSessionAdapter {
  getAccessToken: () => string | null
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
  onSessionExpired: () => void
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
}

const rawApiBaseUrl: unknown = import.meta.env.VITE_API_URL
const apiBaseUrl = typeof rawApiBaseUrl === 'string' ? rawApiBaseUrl : ''

if (!apiBaseUrl) {
  throw new Error('VITE_API_URL is required')
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
})

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
})

const excludedRefreshPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
]

let sessionAdapter: AuthSessionAdapter | null = null
let refreshPromise: Promise<string> | null = null

export const configureAuthSession = (adapter: AuthSessionAdapter): void => {
  sessionAdapter = adapter
}

export const requestAccessTokenRefresh = async (): Promise<string> => {
  const response = await refreshClient.post<unknown>('/auth/refresh')
  return refreshResponseSchema.parse(response.data).data.accessToken
}

const getSharedRefreshToken = (): Promise<string> => {
  refreshPromise ??= requestAccessTokenRefresh().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const accessToken = sessionAdapter?.getAccessToken()

  if (accessToken && !excludedRefreshPaths.includes(config.url ?? '')) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    const requestPath = config?.url ?? ''
    const hasBearerToken =
      config?.headers instanceof AxiosHeaders
        ? config.headers.has('Authorization')
        : false

    if (
      error.response?.status !== 401 ||
      !config ||
      config._authRetry ||
      !hasBearerToken ||
      excludedRefreshPaths.includes(requestPath)
    ) {
      return Promise.reject(error)
    }

    config._authRetry = true

    try {
      const accessToken = await getSharedRefreshToken()
      sessionAdapter?.setAccessToken(accessToken)
      config.headers.set('Authorization', `Bearer ${accessToken}`)
      return await apiClient(config)
    } catch (refreshError) {
      sessionAdapter?.clearAuth()
      sessionAdapter?.onSessionExpired()
      return Promise.reject(
        refreshError instanceof Error
          ? refreshError
          : new Error('Session refresh failed'),
      )
    }
  },
)
