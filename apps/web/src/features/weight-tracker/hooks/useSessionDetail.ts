import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchSession } from '../services/weight-tracker.service.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useSessionDetail = (sessionId: string) => {
  const { t } = useTranslation('weightTracker')
  const load = useCallback(() => fetchSession(sessionId), [sessionId])
  return useAsyncResource(load, t('errors.workout'))
}
