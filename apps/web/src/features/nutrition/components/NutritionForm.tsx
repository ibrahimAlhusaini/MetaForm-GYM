import type {
  NutritionCalculationRequest,
  NutritionProfileInputs,
} from '@metaform/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calculator } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import {
  activityOptions,
  genderOptions,
  goalOptions,
} from '../constants/nutrition.constants.js'
import type { NutritionFormValues } from '../types/nutrition.types.js'
import {
  nutritionRequestFromForm,
  profileToFormValues,
} from '../utils/nutrition-payload.js'
import { nutritionFormSchema } from '../validation/nutrition.schema.js'
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
  const form = useForm<NutritionFormValues>({
    resolver: zodResolver(nutritionFormSchema),
    defaultValues: profileToFormValues(profile),
    mode: 'onBlur',
  })
  const selectedGender = useWatch({ control: form.control, name: 'gender' })
  const sourceLabel = (field: keyof NutritionFormValues): string => {
    if (form.formState.dirtyFields[field]) return 'Manually entered'
    return profile.completeness[field] ? 'From profile' : 'Required'
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
          <h2 className="text-xl font-semibold">Your inputs</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Values are used for this calculation only.
          </p>
        </div>
        <Calculator className="size-6 text-lime-300" aria-hidden="true" />
      </div>
      <div className="mt-5">
        <ProfilePrefillNotice profile={profile} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Age"
          unit="years"
          source={sourceLabel('age')}
          error={form.formState.errors.age}
          registration={form.register('age')}
          inputMode="numeric"
        />
        <SelectField
          label="Gender"
          source={sourceLabel('gender')}
          error={form.formState.errors.gender}
          registration={form.register('gender')}
          options={genderOptions}
        />
        <FormField
          label="Height"
          unit="cm"
          source={sourceLabel('heightCm')}
          error={form.formState.errors.heightCm}
          registration={form.register('heightCm')}
          inputMode="decimal"
        />
        <FormField
          label="Weight"
          unit="kg"
          source={sourceLabel('weightKg')}
          error={form.formState.errors.weightKg}
          registration={form.register('weightKg')}
          inputMode="decimal"
        />
        <SelectField
          label="Activity level"
          source={sourceLabel('activityLevel')}
          error={form.formState.errors.activityLevel}
          registration={form.register('activityLevel')}
          options={activityOptions}
        />
        <SelectField
          label="Fitness goal"
          source={sourceLabel('goal')}
          error={form.formState.errors.goal}
          registration={form.register('goal')}
          options={goalOptions}
        />
      </div>
      {selectedGender === 'PREFER_NOT_TO_SAY' ? (
        <p className="mt-4 rounded-xl border border-white/10 p-3 text-sm leading-6 text-zinc-400">
          Mifflin-St Jeor requires a temporary male or female input. Selecting
          one here will not change your stored profile preference.
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
        {pending ? 'Calculating...' : 'Calculate targets'}
      </button>
    </form>
  )
}
