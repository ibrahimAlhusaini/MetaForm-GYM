import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchProfileCompleteness } from '../services/profile.service.js'

export const useProfileCompleteness = () => {
  const { t } = useTranslation('profile')
  const load = useCallback(() => fetchProfileCompleteness(), [])
  return useAsyncResource(load, t('errors.completeness'))
}
