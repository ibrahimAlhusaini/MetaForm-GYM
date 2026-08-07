import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchLatestNutrition } from '../services/nutrition.service.js'

export const useLatestNutrition = () => {
  const { t } = useTranslation('nutrition')
  const load = useCallback(() => fetchLatestNutrition(), [])
  return useAsyncResource(load, t('errors.latest'))
}
