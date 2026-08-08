import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RouteLoadingFallback() {
  const { t } = useTranslation('common')
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-64 items-center justify-center rounded-2xl border border-white/8 bg-[#111315] p-8 text-zinc-300"
    >
      <LoaderCircle
        className="me-3 size-5 animate-spin text-lime-300"
        aria-hidden="true"
      />
      <span>{t('states.loadingRoute')}</span>
    </div>
  )
}
