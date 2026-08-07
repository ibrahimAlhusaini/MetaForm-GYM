import type { ProfileUpdateRequest } from '@metaform/shared-types'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateProfile } from '../services/profile.service.js'

export const useProfileMutation = () => {
  const { t } = useTranslation('profile')
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const submit = useCallback(
    async (input: ProfileUpdateRequest) => {
      if (inFlight.current) return null
      inFlight.current = true
      setPending(true)
      setErrorMessage(null)
      setSuccessMessage(null)
      try {
        const profile = await updateProfile(input)
        setSuccessMessage(t('feedback.saved'))
        return profile
      } catch {
        setErrorMessage(t('errors.save'))
        return null
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [t],
  )
  return { pending, errorMessage, successMessage, submit }
}
