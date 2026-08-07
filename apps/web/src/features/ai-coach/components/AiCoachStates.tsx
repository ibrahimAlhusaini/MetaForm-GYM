import { AlertCircle, Bot, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function AiCoachLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="grid min-h-48 place-items-center text-zinc-400"
    >
      <div className="text-center">
        <LoaderCircle
          className="mx-auto size-7 animate-spin text-lime-300"
          aria-hidden="true"
        />
        <p className="mt-3">{label}</p>
      </div>
    </div>
  )
}

export function AiCoachError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation(['aiCoach', 'common'])
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-300/20 bg-[#111315] p-7 text-center"
    >
      <AlertCircle
        className="mx-auto size-7 text-amber-200"
        aria-hidden="true"
      />
      <h2 className="mt-3 text-lg font-semibold">
        {t('aiCoach:errors.title')}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-white px-5 font-semibold text-zinc-950 focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        {t('common:actions.retry')}
      </button>
    </div>
  )
}

export function AiCoachEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
      <Bot className="mx-auto size-8 text-zinc-500" aria-hidden="true" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
        {description}
      </p>
    </div>
  )
}
