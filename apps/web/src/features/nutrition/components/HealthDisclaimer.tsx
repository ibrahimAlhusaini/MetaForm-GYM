import { HeartPulse } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HealthDisclaimer() {
  const { t } = useTranslation('nutrition')
  return (
    <aside
      aria-label={t('disclaimer.label')}
      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-zinc-400"
    >
      <HeartPulse
        className="mt-0.5 size-5 shrink-0 text-lime-300"
        aria-hidden="true"
      />
      <div>
        <h2 className="font-semibold text-zinc-100">{t('disclaimer.title')}</h2>
        <p className="mt-1">{t('disclaimer.text')}</p>
      </div>
    </aside>
  )
}
