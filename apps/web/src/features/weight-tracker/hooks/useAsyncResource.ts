import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string }
  | { status: 'success'; data: T; errorMessage: null }

export const useAsyncResource = <T>(
  load: () => Promise<T>,
  errorMessage: string,
) => {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<AsyncState<T>>({
    status: 'loading',
    data: null,
    errorMessage: null,
  })
  useEffect(() => {
    let active = true
    const run = async () => {
      await Promise.resolve()
      if (active)
        setState({ status: 'loading', data: null, errorMessage: null })
      try {
        const data = await load()
        if (active) setState({ status: 'success', data, errorMessage: null })
      } catch {
        if (active) setState({ status: 'error', data: null, errorMessage })
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [attempt, errorMessage, load])
  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])
  return { state, retry }
}
