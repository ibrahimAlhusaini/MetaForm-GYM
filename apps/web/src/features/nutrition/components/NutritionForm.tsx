import type {
  NutritionCalculationRequest,
  NutritionProfileInputs,
} from '@metaform/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator } from 'lucide-react'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
} from '../constants/nutrition.constants.js'
import type { NutritionFormValues } from '../types/nutrition.types.js'
import {
  nutritionRequestFromForm,
  profileToFormValues,
} from '../utils/nutrition-payload.js'
import { createNutritionFormSchema } from '../validation/nutrition.schema.js'
import { ProfilePrefillNotice } from './ProfilePrefillNotice.js'
import { FormField, SelectField } from './NutritionFormFields.js'

export function NutritionForm({
  profile,
  pending,
  errorMessage,
  onCalculate,
}: {
  profile: NutritionProfileInputs
  pending: boolean
  errorMessage: string | null
  onCalculate: (input: NutritionCalculationRequest) => Promise<void>
}) {
  const { t } = useTranslation(['nutrition', 'common'])
  const nutritionFormSchema = useMemo(() => createNutritionFormSchema(t), [t])
  const genderOptions = genderValues.map((value) => ({
    value,
    label: genderLabel(t, value),
  }))
  const activityOptions = activityValues.map((value) => ({
    value,
    label: activityLabel(t, value),
  }))
  const goalOptions = goalValues.map((value) => ({
    value,
    label: fitnessGoalLabel(t, value),
  }))
  const form = useForm<NutritionFormValues>({
    resolver: zodResolver(nutritionFormSchema),
    defaultValues: profileToFormValues(profile),
    mode: 'onBlur',
  })
  const selectedGender = useWatch({ control: form.control, name: 'gender' })
  const sourceLabel = (field: keyof NutritionFormValues): string => {
    if (form.formState.dirtyFields[field]) return t('nutrition:form.manual')
    return profile.completeness[field]
      ? t('nutrition:form.fromProfile')
      : t('nutrition:form.required')
  }
  const submit = form.handleSubmit(async (values) => {
    await onCalculate(
      nutritionRequestFromForm(values, form.formState.dirtyFields),
    )
  })
  return (
    <form
      onSubmit={(event) => {
        void submit(event)
      }}
      noValidate
      className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('nutrition:form.title')}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t('nutrition:form.description')}
          </p>
        </div>
        <Calculator className="size-6 text-lime-300" aria-hidden="true" />
      </div>
      <div className="mt-5">
        <ProfilePrefillNotice profile={profile} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField
          label={t('nutrition:form.age')}
          unit={t('nutrition:form.years')}
          source={sourceLabel('age')}
          error={form.formState.errors.age}
          registration={form.register('age')}
          inputMode="numeric"
        />
        <SelectField
          label={t('nutrition:form.gender')}
          placeholder={t('nutrition:form.select', {
            field: t('nutrition:form.gender').toLowerCase(),
          })}
          source={sourceLabel('gender')}
          error={form.formState.errors.gender}
          registration={form.register('gender')}
          options={genderOptions}
        />
        <FormField
          label={t('nutrition:form.height')}
          unit="cm"
          source={sourceLabel('heightCm')}
          error={form.formState.errors.heightCm}
          registration={form.register('heightCm')}
          inputMode="decimal"
        />
        <FormField
          label={t('nutrition:form.weight')}
          unit="kg"
          source={sourceLabel('weightKg')}
          error={form.formState.errors.weightKg}
          registration={form.register('weightKg')}
          inputMode="decimal"
        />
        <SelectField
          label={t('nutrition:form.activity')}
          placeholder={t('nutrition:form.select', {
            field: t('nutrition:form.activity').toLowerCase(),
          })}
          source={sourceLabel('activityLevel')}
          error={form.formState.errors.activityLevel}
          registration={form.register('activityLevel')}
          options={activityOptions}
        />
        <SelectField
          label={t('nutrition:form.goal')}
          placeholder={t('nutrition:form.select', {
            field: t('nutrition:form.goal').toLowerCase(),
          })}
          source={sourceLabel('goal')}
          error={form.formState.errors.goal}
          registration={form.register('goal')}
          options={goalOptions}
        />
      </div>
      {selectedGender === 'PREFER_NOT_TO_SAY' ? (
        <p className="mt-4 rounded-xl border border-white/10 p-3 text-sm leading-6 text-zinc-400">
          {t('nutrition:form.genderExplanation')}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 w-full rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? t('nutrition:form.calculating')
          : t('nutrition:form.calculate')}
      </button>
    </form>
  )
}
