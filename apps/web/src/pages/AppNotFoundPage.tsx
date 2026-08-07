import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { appPaths } from '../config/navigation.config.js'

export function AppNotFoundPage() {
  const { t } = useTranslation('navigation')
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
        {t('notFound.appEyebrow')}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">
        {t('notFound.appTitle')}
      </h1>
      <p className="mt-4 leading-7 text-zinc-400">
        {t('notFound.appDescription')}
      </p>
      <Link
        to={appPaths.home}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-300"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t('notFound.returnDashboard')}
      </Link>
    </section>
  )
}
