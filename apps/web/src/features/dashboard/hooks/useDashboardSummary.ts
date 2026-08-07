import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DashboardSummaryData } from '@metaform/shared-types'
import { fetchDashboardSummary } from '../services/dashboard.service.js'

type DashboardState =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string }
  | { status: 'success'; data: DashboardSummaryData; errorMessage: null }

interface DashboardSummaryHook {
  state: DashboardState
  retry: () => void
}

export function useDashboardSummary(): DashboardSummaryHook {
  const { t } = useTranslation('dashboard')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<DashboardState>({
    status: 'loading',
    data: null,
    errorMessage: null,
  })

  useEffect(() => {
    let isCurrentRequest = true

    void fetchDashboardSummary().then(
      (data) => {
        if (isCurrentRequest) {
          setState({ status: 'success', data, errorMessage: null })
        }
      },
      () => {
        if (isCurrentRequest) {
          setState({
            status: 'error',
            data: null,
            errorMessage: t('error.message'),
          })
        }
      },
    )

    return () => {
      isCurrentRequest = false
    }
  }, [attempt, t])

  const retry = useCallback(() => {
    setState({ status: 'loading', data: null, errorMessage: null })
    setAttempt((currentAttempt) => currentAttempt + 1)
  }, [])

  return { state, retry }
}
