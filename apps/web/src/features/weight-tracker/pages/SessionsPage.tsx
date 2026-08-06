import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
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
          <h1 className="text-3xl font-semibold">Workout sessions</h1>
          <p className="mt-2 text-zinc-400">
            Review completed workouts and continue sessions in progress.
          </p>
        </div>
        <Link
          to="new"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
        >
          <Plus className="size-4" />
          New workout
        </Link>
      </header>
      <section
        aria-label="Workout filters"
        className="mt-7 grid gap-3 rounded-2xl border border-white/8 bg-[#111315] p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="text-sm text-zinc-400">
          Status
          <select
            value={completed}
            onChange={(e) => {
              setCompleted(e.target.value)
              setPage(1)
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="">All workouts</option>
            <option value="true">Completed</option>
            <option value="false">In progress</option>
          </select>
        </label>
        <label className="text-sm text-zinc-400">
          From
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
          To
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
          Order
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as 'asc' | 'desc')
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151719] px-3"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </section>
      <div className="mt-6">
        {state.status === 'loading' ? (
          <WeightTrackerSkeleton label="Loading workouts" />
        ) : state.status === 'error' ? (
          <WeightTrackerErrorState
            message={state.errorMessage}
            onRetry={retry}
          />
        ) : state.data.items.length === 0 ? (
          <EmptyState
            title="No workouts found"
            description="Start a workout or adjust the current filters."
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
