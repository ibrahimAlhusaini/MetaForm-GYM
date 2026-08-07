import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { muscleLabel } from '../../../i18n/enum-labels.js'
import { muscleGroups } from '../constants/weight-tracker.constants.js'
import {
  createMachineFormSchema,
  type MachineFormValues,
} from '../validation/weight-tracker.schemas.js'
import { MachineImage } from './MachineImage.js'

export function MachineForm({
  defaultValues,
  submitLabel,
  pending,
  errorMessage,
  onSubmit,
}: {
  defaultValues?: MachineFormValues
  submitLabel: string
  pending: boolean
  errorMessage: string | null
  onSubmit: (values: MachineFormValues) => Promise<void>
}) {
  const { t } = useTranslation('weightTracker')
  const schema = useMemo(() => createMachineFormSchema(t), [t])
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      name: '',
      imageUrl: '',
      targetMuscle: 'CHEST',
      description: '',
    },
  })
  const name = useWatch({ control, name: 'name' })
  const imageUrl = useWatch({ control, name: 'imageUrl' })
  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="space-y-5 rounded-2xl border border-white/8 bg-[#111315] p-5 sm:p-7">
        <div>
          <label htmlFor="machine-name" className="block text-sm font-medium">
            {t('machines.form.name')}
          </label>
          <input
            id="machine-name"
            aria-describedby={errors.name ? 'machine-name-error' : undefined}
            {...register('name')}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 outline-none focus:border-lime-300"
          />
          {errors.name ? (
            <span
              id="machine-name-error"
              className="mt-1 block text-sm text-red-300"
            >
              {errors.name.message}
            </span>
          ) : null}
        </div>
        <div>
          <label htmlFor="machine-muscle" className="block text-sm font-medium">
            {t('machines.form.muscle')}
          </label>
          <select
            id="machine-muscle"
            {...register('targetMuscle')}
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3 outline-none focus:border-lime-300"
          >
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {muscleLabel(t, group)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="machine-image-url"
            className="block text-sm font-medium"
          >
            {t('machines.form.imageUrl')}{' '}
            <span className="text-zinc-500">{t('machines.form.optional')}</span>
          </label>
          <input
            id="machine-image-url"
            aria-describedby={
              errors.imageUrl ? 'machine-image-error' : undefined
            }
            {...register('imageUrl')}
            inputMode="url"
            dir="ltr"
            placeholder="https://…"
            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 outline-none focus:border-lime-300"
          />
          {errors.imageUrl ? (
            <span
              id="machine-image-error"
              className="mt-1 block text-sm text-red-300"
            >
              {errors.imageUrl.message}
            </span>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="machine-description"
            className="block text-sm font-medium"
          >
            {t('machines.form.description')}{' '}
            <span className="text-zinc-500">{t('machines.form.optional')}</span>
          </label>
          <textarea
            id="machine-description"
            {...register('description')}
            rows={5}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-lime-300"
          />
        </div>
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200"
          >
            {errorMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-xl bg-lime-300 px-6 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {pending ? t('machines.form.saving') : submitLabel}
        </button>
      </div>
      <aside className="rounded-2xl border border-white/8 bg-[#111315] p-4">
        <p className="mb-3 text-sm font-medium text-zinc-400">
          {t('machines.form.preview')}
        </p>
        <MachineImage
          imageUrl={imageUrl || null}
          name={name || t('machines.form.previewFallback')}
          className="aspect-[4/3] w-full rounded-xl"
        />
        <p className="mt-4 font-semibold">
          {name || t('machines.form.previewName')}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {t('machines.form.previewDescription')}
        </p>
      </aside>
    </form>
  )
}
