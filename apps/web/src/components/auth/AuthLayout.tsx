import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../LanguageSwitcher.js'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: AuthLayoutProps) {
  const { t } = useTranslation('auth')
  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(32rem,0.95fr)]">
        <aside className="relative hidden overflow-hidden border-e border-white/8 bg-[#0c0e0f] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="auth-grid absolute inset-0 opacity-50" />
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-lime-300/8 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-lime-300 font-black text-zinc-950">
              M
            </span>
            <span className="text-sm font-semibold tracking-[0.22em] text-zinc-200">
              METAFORM GYM
            </span>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-8 flex items-center gap-4" aria-hidden="true">
              <span className="h-px w-16 bg-lime-300" />
              <span className="size-2 rounded-full bg-lime-300 shadow-[0_0_24px_rgba(217,249,75,0.8)]" />
            </div>
            <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-lime-300 uppercase">
              {t('layout.eyebrow')}
            </p>
            <h2 className="max-w-lg text-5xl leading-[1.04] font-semibold tracking-[-0.04em] xl:text-6xl">
              {t('layout.title')}
            </h2>
            <p className="mt-7 max-w-md text-lg leading-8 text-zinc-400">
              {t('layout.description')}
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-zinc-500">
            <span className="size-2 rounded-full bg-lime-300" />
            {t('layout.secure')}
          </div>
        </aside>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute end-5 top-5">
            <LanguageSwitcher />
          </div>
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-xl bg-lime-300 font-black text-zinc-950">
                M
              </span>
              <span className="text-xs font-semibold tracking-[0.2em] text-zinc-200">
                METAFORM GYM
              </span>
            </div>

            <header className="mb-8">
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-lime-300 uppercase">
                {eyebrow}
              </p>
              <h1 className="text-4xl font-semibold tracking-[-0.035em] text-white sm:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-sm leading-7 text-zinc-400">
                {description}
              </p>
            </header>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
