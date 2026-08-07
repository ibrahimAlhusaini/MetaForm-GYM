import type {
  NutritionCalculationData,
  NutritionCalculationRequest,
} from '@metaform/shared-types'
import { useCallback, useRef, useState } from 'react'
import { calculateNutrition } from '../services/nutrition.service.js'

export const useNutritionCalculation = () => {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<NutritionCalculationData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submit = useCallback(async (input: NutritionCalculationRequest) => {
    if (inFlight.current) return null
    inFlight.current = true
    setPending(true)
    setErrorMessage(null)
    try {
      const data = await calculateNutrition(input)
      setResult(data)
      return data
    } catch {
      setErrorMessage(
        'We could not calculate your nutrition targets. Your entries are still here; please try again.',
      )
      return null
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }, [])
  return { pending, result, errorMessage, submit }
}
