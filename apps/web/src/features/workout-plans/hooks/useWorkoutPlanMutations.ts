import { useCallback, useRef, useState } from 'react'

export const useWorkoutPlanMutations = () => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const run = useCallback(
    async <T>(
      mutation: () => Promise<T>,
      safeError: string,
    ): Promise<T | null> => {
      if (inFlight.current) return null
      inFlight.current = true
      setPending(true)
      setError(null)
      try {
        return await mutation()
      } catch {
        setError(safeError)
        return null
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [],
  )
  return {
    pending,
    error,
    clearError: () => {
      setError(null)
    },
    run,
  }
}
