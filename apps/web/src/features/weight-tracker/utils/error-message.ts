import axios from 'axios'
import i18n from '../../../i18n/index.js'

const safeMessages: Record<string, string> = {
  'Resource not found': 'errors.notFound',
  'Machine cannot be deleted because workout history references it':
    'errors.machineConflictShort',
}

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
  return typeof message === 'string' && safeMessages[message]
    ? i18n.t(safeMessages[message], { ns: 'weightTracker' })
    : fallback
}

export const isMachineHistoryConflict = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 409
