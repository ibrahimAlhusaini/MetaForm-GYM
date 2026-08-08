import { ArrowRight, Dumbbell, Plus, Scale, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMachines } from '../hooks/useMachines.js'
import { useSessions } from '../hooks/useSessions.js'
import { AsyncStatePanel } from '../components/WeightTrackerOverviewStates.js'

export function WeightTrackerPage() {
  const { t } = useTranslation('weightTracker')
  const machineQuery = useMemo(
    () => ({
      page: 1,
      limit: 3,
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [],
  )
  const sessionQuery = useMemo(
    () => ({
      page: 1,
      limit: 5,
      sortBy: 'startedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [],
  )
  const machines = useMachines(machineQuery)
  const sessions = useSessions(sessionQuery)
  return (
    <div>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[.18em] text-lime-300 uppercase">
            {t('overview.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('overview.title')}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            {t('overview.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="sessions/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
          >
            <Dumbbell className="size-5" />
            {t('overview.start')}
          </Link>
          <Link
            to="machines/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 px-5 font-semibold"
          >
            <Plus className="size-5" />
            {t('overview.addMachine')}
          </Link>
        </div>
      </header>
      <div className="mt-9 grid gap-6 xl:grid-cols-2">
        <AsyncStatePanel
          title={t('overview.recent')}
          kind="sessions"
          resource={sessions}
          browsePath="sessions"
          emptyTitle={t('overview.noWorkouts')}
          emptyDescription={t('overview.noWorkoutsDescription')}
        />
        <AsyncStatePanel
          title={t('overview.machines')}
          kind="machines"
          resource={machines}
          browsePath="machines"
          emptyTitle={t('overview.noMachines')}
          emptyDescription={t('overview.noMachinesDescription')}
        />
      </div>
      <section className="mt-6 rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-300/8 to-transparent p-6">
        <Scale className="size-6 text-violet-300" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">
          {t('overview.bodyWeight')}
        </h2>
        <p className="mt-2 max-w-2xl text-zinc-400">
          {t('overview.bodyWeightDescription')}
        </p>
        <Link
          to="body-weight"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-violet-300"
        >
          {t('overview.openBodyWeight')}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </section>
      <section className="mt-6 rounded-2xl border border-lime-300/15 bg-gradient-to-r from-lime-300/8 to-transparent p-6">
        <TrendingUp className="size-6 text-lime-300" />
        <h2 className="mt-4 text-xl font-semibold">{t('overview.progress')}</h2>
        <p className="mt-2 max-w-2xl text-zinc-400">
          {t('overview.progressDescription')}
        </p>
        <Link
          to="machines"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-lime-300"
        >
          {t('overview.browseMachines')}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      </section>
    </div>
  )
}
