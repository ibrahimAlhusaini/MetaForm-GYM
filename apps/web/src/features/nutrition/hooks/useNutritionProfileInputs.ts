import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchNutritionProfileInputs } from '../services/nutrition.service.js'

export const useNutritionProfileInputs = () => {
  const { t } = useTranslation('nutrition')
  const load = useCallback(() => fetchNutritionProfileInputs(), [])
  return useAsyncResource(load, t('errors.profile'))
}
