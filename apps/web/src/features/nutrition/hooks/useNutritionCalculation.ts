import type {
  NutritionCalculationData,
  NutritionCalculationRequest,
} from '@metaform/shared-types'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateNutrition } from '../services/nutrition.service.js'

export const useNutritionCalculation = () => {
  const { t } = useTranslation('nutrition')
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<NutritionCalculationData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submit = useCallback(
    async (input: NutritionCalculationRequest) => {
      if (inFlight.current) return null
      inFlight.current = true
      setPending(true)
      setErrorMessage(null)
      try {
        const data = await calculateNutrition(input)
        setResult(data)
        return data
      } catch {
        setErrorMessage(t('errors.calculation'))
        return null
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [t],
  )
  return { pending, result, errorMessage, submit }
}
