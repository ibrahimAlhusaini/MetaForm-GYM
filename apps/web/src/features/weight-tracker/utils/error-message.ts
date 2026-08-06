import axios from 'axios'

const safeMessages = new Set([
  'Resource not found',
  'Machine cannot be deleted because workout history references it',
])

export const weightTrackerErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!axios.isAxiosError(error)) return fallback
  const responseData: unknown = error.response?.data
  const message =
    typeof responseData === 'object' &&
    responseData !== null &&
    'message' in responseData
      ? responseData.message
      : undefined
  return typeof message === 'string' && safeMessages.has(message)
    ? message
    : fallback
}

export const isMachineHistoryConflict = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 409
