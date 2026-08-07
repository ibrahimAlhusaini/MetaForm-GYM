import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchAiCoachSession } from '../services/ai-coach.service.js'

export const useAiCoachSession = (sessionId: string) => {
  const { t } = useTranslation('aiCoach')
  const load = useCallback(() => fetchAiCoachSession(sessionId), [sessionId])
  return useAsyncResource(load, t('errors.detail'))
}
