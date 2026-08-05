import axios from 'axios'
import {
  apiErrorResponseSchema,
  authResponseSchema,
  currentUserResponseSchema,
  type AuthenticatedUser,
  type LoginRequest,
  type RegisterRequest,
} from '../types/auth.js'
import { apiClient, requestAccessTokenRefresh } from './api-client.js'

const safeAuthError = (error: unknown, fallback: string): Error => {
  if (!axios.isAxiosError(error)) {
    return new Error(fallback)
  }

  if (!error.response) {
    return new Error(
      'Unable to reach the server. Check your connection and try again.',
    )
  }

  const parsedError = apiErrorResponseSchema.safeParse(error.response.data)

  if (error.response.status === 429) {
    return new Error('Too many attempts. Please wait and try again.')
  }

  if (parsedError.success) {
    const allowedMessages = new Set([
      'Invalid email or password',
      'An account with this email already exists',
      'Account is inactive',
    ])

    if (allowedMessages.has(parsedError.data.message)) {
      return new Error(parsedError.data.message)
    }
  }

  return new Error(fallback)
}

export const loginRequest = async (input: LoginRequest) => {
  try {
    const response = await apiClient.post<unknown>('/auth/login', input)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    throw safeAuthError(error, 'Unable to sign in. Please try again.')
  }
}

export const registerRequest = async (input: RegisterRequest) => {
  try {
    const response = await apiClient.post<unknown>('/auth/register', input)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    throw safeAuthError(
      error,
      'Unable to create your account. Please try again.',
    )
  }
}

export const fetchCurrentUserRequest = async (): Promise<AuthenticatedUser> => {
  try {
    const response = await apiClient.get<unknown>('/auth/me')
    return currentUserResponseSchema.parse(response.data).data.user
  } catch (error) {
    throw safeAuthError(error, 'Unable to load your account.')
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
