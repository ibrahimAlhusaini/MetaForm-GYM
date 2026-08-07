import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchAiCoachCapabilities } from '../services/ai-coach.service.js'

export const useAiCoachCapabilities = () => {
  const { t } = useTranslation('aiCoach')
  const load = useCallback(() => fetchAiCoachCapabilities(), [])
  return useAsyncResource(load, t('errors.capabilities'))
}
