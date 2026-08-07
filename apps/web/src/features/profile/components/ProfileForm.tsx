import type {
  ProfileDetail,
  ProfileUpdateRequest,
} from '@metaform/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Undo2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { ProfileFormValues } from '../types/profile.types.js'
import {
  buildProfileUpdatePayload,
  hasProfileUpdates,
  profileToFormValues,
} from '../utils/profile-payload.js'
import { createProfileFormSchema } from '../validation/profile.schema.js'
import { ProfileFormFields } from './ProfileFormFields.js'

export function ProfileForm({
  profile,
  pending,
  errorMessage,
  successMessage,
  onSubmit,
  onSave,
}: {
  profile: ProfileDetail
  pending: boolean
  errorMessage: string | null
  successMessage: string | null
  onSubmit: (input: ProfileUpdateRequest) => Promise<ProfileDetail | null>
  onSave: (profile: ProfileDetail) => void
}) {
  const { t } = useTranslation(['profile', 'common'])
  const schema = useMemo(() => createProfileFormSchema(t), [t])
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: profileToFormValues(profile),
    mode: 'onBlur',
  })
  useEffect(() => {
    form.reset(profileToFormValues(profile))
  }, [form, profile])
  const canSave = hasProfileUpdates(
    form.formState.dirtyFields,
    profile.initialized,
  )
  const submit = form.handleSubmit(async (values) => {
    if (!canSave || pending) return
    const updated = await onSubmit(
      buildProfileUpdatePayload(
        values,
        form.formState.dirtyFields,
        profile.initialized,
      ),
    )
    if (updated) onSave(updated)
  })
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6"
    >
      <h2 className="text-xl font-semibold">{t('profile:form.title')}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        {t('profile:form.description')}
      </p>
      {!profile.initialized ? (
        <div className="mt-5 rounded-xl border border-lime-300/20 bg-lime-300/5 p-4">
          <h3 className="font-semibold">{t('profile:missingProfile.title')}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {t('profile:missingProfile.description')}
          </p>
        </div>
      ) : null}
      <div className="mt-6">
        <ProfileFormFields form={form} />
      </div>
      <div aria-live="polite" className="mt-5 min-h-6 text-sm">
        {errorMessage ? (
          <p role="alert" className="text-red-300">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="text-lime-300">{successMessage}</p>
        ) : null}
        {!errorMessage && !successMessage && !canSave ? (
          <p className="text-zinc-500">{t('profile:form.noChanges')}</p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={!form.formState.isDirty || pending}
          onClick={() => {
            form.reset(profileToFormValues(profile))
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 font-semibold disabled:opacity-40"
        >
          <Undo2 className="size-4" aria-hidden="true" />
          {t('profile:form.discard')}
        </button>
        <button
          type="submit"
          disabled={!canSave || pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="size-4" aria-hidden="true" />
          {pending ? t('profile:form.saving') : t('profile:form.save')}
        </button>
      </div>
    </form>
  )
}
