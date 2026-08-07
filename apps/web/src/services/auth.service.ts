import axios from 'axios'
import {
  apiErrorResponseSchema,
  authResponseSchema,
  currentUserResponseSchema,
  type AuthenticatedUser,
  type AuthErrorCode,
  type LoginRequest,
  type RegisterRequest,
} from '../types/auth.js'
import { apiClient, requestAccessTokenRefresh } from './api-client.js'

export class AuthRequestError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
  }
}

const safeAuthError = (
  error: unknown,
  fallback: AuthErrorCode,
): AuthRequestError => {
  if (!axios.isAxiosError(error)) {
    return new AuthRequestError(fallback)
  }

  if (!error.response) {
    return new AuthRequestError('network')
  }

  const parsedError = apiErrorResponseSchema.safeParse(error.response.data)

  if (error.response.status === 429) {
    return new AuthRequestError('rateLimited')
  }

  if (parsedError.success) {
    const knownMessages: Record<string, AuthErrorCode> = {
      'Invalid email or password': 'invalidCredentials',
      'An account with this email already exists': 'emailExists',
      'Account is inactive': 'inactive',
    }
    const code = knownMessages[parsedError.data.message]
    if (code) return new AuthRequestError(code)
  }

  return new AuthRequestError(fallback)
}

export const loginRequest = async (input: LoginRequest) => {
  try {
    const response = await apiClient.post<unknown>('/auth/login', input)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    throw safeAuthError(error, 'login')
  }
}

export const registerRequest = async (input: RegisterRequest) => {
  try {
    const response = await apiClient.post<unknown>('/auth/register', input)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    throw safeAuthError(error, 'register')
  }
}

export const fetchCurrentUserRequest = async (): Promise<AuthenticatedUser> => {
  try {
    const response = await apiClient.get<unknown>('/auth/me')
    return currentUserResponseSchema.parse(response.data).data.user
  } catch (error) {
    throw safeAuthError(error, 'account')
  }
}

export const refreshSessionRequest = async (): Promise<string> => {
  try {
    return await requestAccessTokenRefresh()
  } catch {
    throw new Error('Session could not be restored')
  }
}

export const logoutRequest = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Client authentication is still cleared when the server is unavailable.
  }
}
