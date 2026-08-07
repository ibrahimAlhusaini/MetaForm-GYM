import { AlertCircle, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ProfileSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="rounded-2xl border border-white/10 bg-[#111315] p-6"
    >
      <LoaderCircle
        className="size-6 animate-spin text-lime-300"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
      <div className="mt-5 h-5 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-20 animate-pulse rounded-xl bg-white/5" />
    </div>
  )
}

export function ProfileErrorState({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation('common')
  return (
    <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
      <AlertCircle className="size-6 text-red-300" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold hover:border-lime-300 focus:outline-2 focus:outline-offset-2 focus:outline-lime-300"
      >
        {t('actions.retry')}
      </button>
    </section>
  )
}
