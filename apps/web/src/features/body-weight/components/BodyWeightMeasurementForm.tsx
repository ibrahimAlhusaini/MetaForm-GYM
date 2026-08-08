import type { CreateBodyMeasurementRequest } from '@metaform/shared-types'
import { Save } from 'lucide-react'
import { useState, type SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  saving: boolean
  serviceError: string | null
  onSave: (input: CreateBodyMeasurementRequest) => Promise<boolean>
}

const localDateTimeValue = (): string => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function BodyWeightMeasurementForm({
  saving,
  serviceError,
  onSave,
}: Props) {
  const { t } = useTranslation('bodyWeight')
  const [measuredAt, setMeasuredAt] = useState(localDateTimeValue)
  const [weightKg, setWeightKg] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const saveMeasurement = async () => {
    const weight = Number(weightKg)
    const date = new Date(measuredAt)
    if (!measuredAt || Number.isNaN(date.getTime()) || date > new Date()) {
      setValidationError(t('validation.date'))
      return
    }
    if (!Number.isFinite(weight) || weight < 30 || weight > 350) {
      setValidationError(t('validation.weight'))
      return
    }
    setValidationError(null)
    const saved = await onSave({
      measuredAt: date.toISOString(),
      weightKg: Math.round(weight * 100) / 100,
    })
    if (saved) {
      setWeightKg('')
      setMeasuredAt(localDateTimeValue())
    }
  }

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    void saveMeasurement()
  }

  const error = validationError ?? serviceError
  return (
    <section
      aria-labelledby="body-weight-log-title"
      className="rounded-2xl border border-white/8 bg-[#111315] p-5 sm:p-6"
    >
      <h2 id="body-weight-log-title" className="text-xl font-semibold">
        {t('form.title')}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {t('form.description')}
      </p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={submit}
        noValidate
      >
        <label className="grid gap-2 text-sm font-medium">
          {t('form.measuredAt')}
          <input
            type="datetime-local"
            value={measuredAt}
            max={localDateTimeValue()}
            onChange={(event) => {
              setMeasuredAt(event.target.value)
            }}
            className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-white scheme-dark"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {t('form.weightKg')}
          <input
            type="number"
            inputMode="decimal"
            min="30"
            max="350"
            step="0.01"
            value={weightKg}
            onChange={(event) => {
              setWeightKg(event.target.value)
            }}
            className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-white"
            aria-describedby={error ? 'body-weight-form-error' : undefined}
            required
          />
        </label>
        <div className="sm:col-span-2">
          {error ? (
            <p
              id="body-weight-form-error"
              role="alert"
              className="mb-3 text-sm text-rose-300"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="size-4" aria-hidden="true" />
            {saving ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </section>
  )
}
