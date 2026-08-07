import type { ExerciseDifficultyLevel } from '@metaform/shared-types'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { difficultyLabel } from '../../../i18n/enum-labels.js'
import type { PlanMetadataFormValues } from '../validation/workout-plan.schemas.js'

const difficulties: ExerciseDifficultyLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]

export function PlanMetadataForm({
  form,
  submitLabel,
  pending,
  onSubmit,
}: {
  form: UseFormReturn<PlanMetadataFormValues>
  submitLabel: string
  pending: boolean
  onSubmit: (values: PlanMetadataFormValues) => void
}) {
  const { t } = useTranslation(['workoutPlans', 'common'])
  const {
    register,
    formState: { errors },
  } = form
  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event)
      }}
      className="rounded-2xl border border-white/10 bg-[#111315] p-5 sm:p-6"
      noValidate
    >
      <h2 className="text-xl font-semibold">
        {t('workoutPlans:builder.metadata')}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">
          {t('workoutPlans:builder.name')}
          <input
            {...register('name')}
            aria-invalid={Boolean(errors.name)}
            maxLength={120}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3"
          />
          {errors.name ? (
            <span role="alert" className="mt-1 block text-sm text-red-300">
              {errors.name.message}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          {t('workoutPlans:builder.description')}{' '}
          <span className="text-zinc-500">
            {t('workoutPlans:labels.optional')}
          </span>
          <textarea
            {...register('description')}
            aria-invalid={Boolean(errors.description)}
            rows={3}
            maxLength={2000}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3"
          />
          {errors.description ? (
            <span role="alert" className="mt-1 block text-sm text-red-300">
              {errors.description.message}
            </span>
          ) : null}
        </label>
        <label className="text-sm font-medium">
          {t('workoutPlans:builder.difficulty')}
          <select
            {...register('difficultyLevel')}
            aria-invalid={Boolean(errors.difficultyLevel)}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            {difficulties.map((item) => (
              <option key={item} value={item}>
                {difficultyLabel(t, item)}
              </option>
            ))}
          </select>
          {errors.difficultyLevel ? (
            <span role="alert" className="mt-1 block text-sm text-red-300">
              {errors.difficultyLevel.message}
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-3 self-end pb-3 text-sm">
          <input
            type="checkbox"
            {...register('isTemplate')}
            className="size-4 accent-lime-300"
          />
          {t('workoutPlans:builder.template')}
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-11 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? t('workoutPlans:builder.saving') : submitLabel}
      </button>
    </form>
  )
}
