import type {
  BodyMeasurementHistoryResponse,
  BodyWeightPredictionData,
  CreateBodyMeasurementRequest,
} from '@metaform/shared-types'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createBodyMeasurement,
  fetchBodyMeasurements,
  fetchBodyWeightPrediction,
} from '../services/body-weight.service.js'

type Loadable<T> =
  | { status: 'loading'; data: null; errorMessage: null }
  | { status: 'error'; data: null; errorMessage: string }
  | { status: 'success'; data: T; errorMessage: null }

const loading = <T>(): Loadable<T> => ({
  status: 'loading',
  data: null,
  errorMessage: null,
})

export function useBodyWeightPage() {
  const { t } = useTranslation('bodyWeight')
  const [history, setHistory] =
    useState<Loadable<BodyMeasurementHistoryResponse['data']>>(loading)
  const [prediction, setPrediction] =
    useState<Loadable<BodyWeightPredictionData>>(loading)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistory(loading())
    try {
      setHistory({
        status: 'success',
        data: await fetchBodyMeasurements(),
        errorMessage: null,
      })
    } catch {
      setHistory({
        status: 'error',
        data: null,
        errorMessage: t('errors.history'),
      })
    }
  }, [t])

  const loadPrediction = useCallback(async () => {
    setPrediction(loading())
    try {
      setPrediction({
        status: 'success',
        data: await fetchBodyWeightPrediction(),
        errorMessage: null,
      })
    } catch {
      setPrediction({
        status: 'error',
        data: null,
        errorMessage: t('errors.prediction'),
      })
    }
  }, [t])

  useEffect(() => {
    let current = true
    void fetchBodyMeasurements().then(
      (data) => {
        if (current) setHistory({ status: 'success', data, errorMessage: null })
      },
      () => {
        if (current) {
          setHistory({
            status: 'error',
            data: null,
            errorMessage: t('errors.history'),
          })
        }
      },
    )
    void fetchBodyWeightPrediction().then(
      (data) => {
        if (current)
          setPrediction({ status: 'success', data, errorMessage: null })
      },
      () => {
        if (current) {
          setPrediction({
            status: 'error',
            data: null,
            errorMessage: t('errors.prediction'),
          })
        }
      },
    )
    return () => {
      current = false
    }
  }, [t])

  const save = useCallback(
    async (input: CreateBodyMeasurementRequest): Promise<boolean> => {
      if (saving) return false
      setSaving(true)
      setSaveError(null)
      try {
        await createBodyMeasurement(input)
        await Promise.all([loadHistory(), loadPrediction()])
        return true
      } catch {
        setSaveError(t('errors.save'))
        return false
      } finally {
        setSaving(false)
      }
    },
    [loadHistory, loadPrediction, saving, t],
  )

  return {
    history,
    prediction,
    saving,
    saveError,
    save,
    retryHistory: loadHistory,
    retryPrediction: loadPrediction,
  }
}
