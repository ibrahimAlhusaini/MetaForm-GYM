import { useCallback } from 'react'
import { fetchSession } from '../services/weight-tracker.service.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useSessionDetail = (sessionId: string) => {
  const load = useCallback(() => fetchSession(sessionId), [sessionId])
  return useAsyncResource(
    load,
    'We could not load this workout. Please try again.',
  )
}
