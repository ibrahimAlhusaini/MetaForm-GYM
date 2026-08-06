import { useCallback } from 'react'
import { fetchMachines } from '../services/weight-tracker.service.js'
import type { MachineQuery } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useMachines = (query: MachineQuery) => {
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
  return useAsyncResource(
    load,
    'We could not load your machines. Please try again.',
  )
}
