import { ArrowRight, Dumbbell, Plus, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'
import { useMemo } from 'react'
import { useMachines } from '../hooks/useMachines.js'
import { useSessions } from '../hooks/useSessions.js'
import { AsyncStatePanel } from '../components/WeightTrackerOverviewStates.js'

export function WeightTrackerPage() {
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
            Training workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Weight Tracker
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Build workouts, record working sets, and review strength progress
            from completed training history.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="sessions/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950"
          >
            <Dumbbell className="size-5" />
            Start workout
          </Link>
          <Link
            to="machines/new"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 px-5 font-semibold"
          >
            <Plus className="size-5" />
            Add machine
          </Link>
        </div>
      </header>
      <div className="mt-9 grid gap-6 xl:grid-cols-2">
        <AsyncStatePanel
          title="Recent workouts"
          kind="sessions"
          resource={sessions}
          browsePath="sessions"
          emptyTitle="No workouts yet"
          emptyDescription="Start your first workout and save its sets in one step."
        />
        <AsyncStatePanel
          title="Custom machines"
          kind="machines"
          resource={machines}
          browsePath="machines"
          emptyTitle="No custom machines yet"
          emptyDescription="Add the machines you use so they are available in the workout builder."
        />
      </div>
      <section className="mt-6 rounded-2xl border border-lime-300/15 bg-gradient-to-r from-lime-300/8 to-transparent p-6">
        <TrendingUp className="size-6 text-lime-300" />
        <h2 className="mt-4 text-xl font-semibold">Progress history</h2>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Open a machine from the list to see PRs, representative weights, and
          completed-session chart history.
        </p>
        <Link
          to="machines"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-lime-300"
        >
          Browse machines
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  )
}
