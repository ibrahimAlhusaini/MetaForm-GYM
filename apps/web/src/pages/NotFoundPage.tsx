import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation('navigation')
  return (
    <main className="grid min-h-screen place-items-center bg-[#090a0b] px-5 text-zinc-50">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-lime-300 uppercase">
          {t('notFound.eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 leading-7 text-zinc-400">
          {t('notFound.description')}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-lime-300 px-5 py-3 font-semibold text-zinc-950 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime-300"
        >
          {t('notFound.return')}
        </Link>
      </div>
    </main>
  )
}
