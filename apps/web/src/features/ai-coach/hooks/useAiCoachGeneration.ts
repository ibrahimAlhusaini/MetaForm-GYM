import type { AiCoachSessionCreateRequest } from '@metaform/shared-types'
import { useCallback, useRef, useState } from 'react'
import { createAiCoachSession } from '../services/ai-coach.service.js'
import type { AiCoachGenerationError } from '../types/ai-coach.types.js'
import { aiCoachGenerationErrorKind } from '../utils/ai-coach-error.js'

export const useAiCoachGeneration = () => {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AiCoachGenerationError>(null)
  const submit = useCallback(async (request: AiCoachSessionCreateRequest) => {
    if (inFlight.current) return null
    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      return await createAiCoachSession(request)
    } catch (caught) {
      setError(aiCoachGenerationErrorKind(caught))
      return null
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }, [])
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  return { pending, error, submit, clearError }
}
