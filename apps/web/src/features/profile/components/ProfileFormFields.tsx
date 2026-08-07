import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  activityLabel,
  fitnessGoalLabel,
  genderLabel,
} from '../../../i18n/enum-labels.js'
import {
  activityValues,
  genderValues,
  goalValues,
} from '../../../i18n/enum-values.js'
import type { ProfileFormValues } from '../types/profile.types.js'

const inputClass =
  'mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 outline-none focus:border-lime-300 focus:ring-2 focus:ring-lime-300/15'

function ErrorText({ message }: { message: string | undefined }) {
  return message ? (
    <span role="alert" className="mt-1.5 block text-xs text-red-300">
      {message}
    </span>
  ) : null
}

export function ProfileFormFields({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>
}) {
  const { t } = useTranslation(['profile', 'common'])
  const errors = form.formState.errors
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">
        {t('profile:form.fullName')}
        <input
          {...form.register('fullName')}
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          className={inputClass}
        />
        <ErrorText message={errors.fullName?.message} />
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.birthDate')}
        <input
          {...form.register('birthDate')}
          type="date"
          dir="ltr"
          aria-invalid={Boolean(errors.birthDate)}
          className={inputClass}
        />
        <ErrorText message={errors.birthDate?.message} />
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.gender')}
        <select {...form.register('gender')} className={inputClass}>
          <option value="">{t('profile:form.select')}</option>
          {genderValues.map((value) => (
            <option key={value} value={value}>
              {genderLabel(t, value)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.height')} (cm)
        <input
          {...form.register('heightCm')}
          inputMode="decimal"
          dir="ltr"
          aria-invalid={Boolean(errors.heightCm)}
          className={inputClass}
        />
        <ErrorText message={errors.heightCm?.message} />
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.weight')} (kg)
        <input
          {...form.register('currentWeightKg')}
          inputMode="decimal"
          dir="ltr"
          aria-describedby="profile-weight-help"
          aria-invalid={Boolean(errors.currentWeightKg)}
          className={inputClass}
        />
        <ErrorText message={errors.currentWeightKg?.message} />
        <span
          id="profile-weight-help"
          className="mt-1.5 block text-xs leading-5 text-zinc-500"
        >
          {t('profile:form.weightHelp')}
        </span>
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.activity')}
        <select {...form.register('activityLevel')} className={inputClass}>
          <option value="">{t('profile:form.select')}</option>
          {activityValues.map((value) => (
            <option key={value} value={value}>
              {activityLabel(t, value)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        {t('profile:form.goal')}
        <select {...form.register('fitnessGoal')} className={inputClass}>
          <option value="">{t('profile:form.select')}</option>
          {goalValues.map((value) => (
            <option key={value} value={value}>
              {fitnessGoalLabel(t, value)}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-5 text-zinc-500 sm:col-span-2">
        {t('profile:form.genderHelp')}
      </p>
    </div>
  )
}
