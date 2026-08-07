import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  EmptyState,
  WeightTrackerErrorState,
  WeightTrackerSkeleton,
} from '../components/AsyncStates.js'
import { PaginationControls } from '../components/PaginationControls.js'
import { SessionList } from '../components/SessionList.js'
import { useSessions } from '../hooks/useSessions.js'
import type { SessionQuery } from '../types/weight-tracker.types.js'

export function SessionsPage() {
  const { t } = useTranslation('weightTracker')
  const [page, setPage] = useState(1)
  const [completed, setCompleted] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const query = useMemo<SessionQuery>(
    () => ({
      page,
      ...(completed === '' ? {} : { completed: completed === 'true' }),
      ...(dateFrom
        ? { dateFrom: new Date(`${dateFrom}T00:00:00`).toISOString() }
        : {}),
      ...(dateTo
        ? { dateTo: new Date(`${dateTo}T23:59:59`).toISOString() }
        : {}),
      sortBy: 'startedAt' as const,
      sortOrder,
    }),
    [completed, dateFrom, dateTo, page, sortOrder],
  )
  const { state, retry } = useSessions(query)
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('sessions.title')}</h1>
          <p className="mt-2 text-zinc-400">{t('sessions.description')}</p>
        </div>
        <Link
          to="new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <Plus className="size-4" />
          {t('sessions.new')}
        </Link>
      </header>
      <section
        aria-label={t('sessions.filters')}
        className="mt-7 grid gap-3 rounded-2xl border border-white/8 bg-[#111315] p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="text-sm text-zinc-400">
          {t('sessions.status')}
          <select
            value={completed}
            onChange={(e) => {
              setCompleted(e.target.value)
              setPage(1)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">{t('sessions.all')}</option>
            <option value="true">{t('sessions.completed')}</option>
            <option value="false">{t('sessions.inProgress')}</option>
          </select>
        </label>
        <label className="text-sm text-zinc-400">
          {t('sessions.from')}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          />
        </label>
        <label className="text-sm text-zinc-400">
          {t('sessions.to')}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          />
        </label>
        <label className="text-sm text-zinc-400">
          {t('sessions.order')}
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as 'asc' | 'desc')
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="desc">{t('sessions.newest')}</option>
            <option value="asc">{t('sessions.oldest')}</option>
          </select>
        </label>
      </section>
      <div className="mt-6">
        {state.status === 'loading' ? (
          <WeightTrackerSkeleton label={t('loading.workouts')} />
        ) : state.status === 'error' ? (
          <WeightTrackerErrorState
            message={state.errorMessage}
            onRetry={retry}
          />
        ) : state.data.items.length === 0 ? (
          <EmptyState
            title={t('sessions.emptyTitle')}
            description={t('sessions.emptyDescription')}
          />
        ) : (
          <>
            <SessionList sessions={state.data.items} />
            <div className="mt-6">
              <PaginationControls
                pagination={state.data.pagination}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
