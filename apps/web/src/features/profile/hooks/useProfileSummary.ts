import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchProfileSummary } from '../services/profile.service.js'

export const useProfileSummary = () => {
  const { t } = useTranslation('profile')
  const load = useCallback(() => fetchProfileSummary(), [])
  return useAsyncResource(load, t('errors.summary'))
}
