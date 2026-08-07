import { AlertCircle, CalendarDays, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function WorkoutPlanLoading({ detail = false }: { detail?: boolean }) {
  const { t } = useTranslation('workoutPlans')
  return (
    <div
      role="status"
      className="grid min-h-64 place-items-center text-zinc-400"
    >
      <div className="text-center">
        <LoaderCircle className="mx-auto size-7 animate-spin text-lime-300" />
        <p className="mt-3">
          {t(detail ? 'states.detailLoading' : 'states.loading')}
        </p>
      </div>
    </div>
  )
}

export function WorkoutPlanError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation('common')
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-400/20 bg-[#111315] p-8 text-center"
    >
      <AlertCircle className="mx-auto size-7 text-red-300" />
      <p className="mt-3 text-zinc-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-white px-5 font-semibold text-zinc-950"
      >
        {t('actions.retry')}
      </button>
    </div>
  )
}

export function WorkoutPlanEmpty({ mine }: { mine: boolean }) {
  const { t } = useTranslation('workoutPlans')
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
      <CalendarDays className="mx-auto size-8 text-zinc-500" />
      <h2 className="mt-4 text-xl font-semibold">
        {t(mine ? 'states.mineEmpty' : 'states.readyEmpty')}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-400">
        {t(
          mine ? 'states.mineEmptyDescription' : 'states.readyEmptyDescription',
        )}
      </p>
    </div>
  )
}
