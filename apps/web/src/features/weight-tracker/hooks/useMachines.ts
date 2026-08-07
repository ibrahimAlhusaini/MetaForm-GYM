import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchMachines } from '../services/weight-tracker.service.js'
import type { MachineQuery } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useMachines = (query: MachineQuery) => {
  const { t } = useTranslation('weightTracker')
  const { limit, page, search, sortBy, sortOrder, targetMuscle } = query
  const load = useCallback(
    () =>
      fetchMachines({
        ...(limit === undefined ? {} : { limit }),
        ...(page === undefined ? {} : { page }),
        ...(search === undefined ? {} : { search }),
        ...(sortBy === undefined ? {} : { sortBy }),
        ...(sortOrder === undefined ? {} : { sortOrder }),
        ...(targetMuscle === undefined ? {} : { targetMuscle }),
      }),
    [limit, page, search, sortBy, sortOrder, targetMuscle],
  )
  return useAsyncResource(load, t('errors.machines'))
}
