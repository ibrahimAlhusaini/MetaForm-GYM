import type { ProfileDetail } from '@metaform/shared-types'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchProfile } from '../services/profile.service.js'

export const useProfile = () => {
  const { t } = useTranslation('profile')
  const [confirmed, setConfirmed] = useState<ProfileDetail | null>(null)
  const load = useCallback(() => fetchProfile(), [])
  const resource = useAsyncResource(load, t('errors.profile'))
  const state = useMemo(() => {
    if (confirmed)
      return { status: 'success' as const, data: confirmed, errorMessage: null }
    return resource.state
  }, [confirmed, resource.state])
  const retry = useCallback(() => {
    setConfirmed(null)
    resource.retry()
  }, [resource])
  return { state, retry, accept: setConfirmed }
}
