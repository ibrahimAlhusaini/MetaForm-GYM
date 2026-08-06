import { Dumbbell, RefreshCw, TriangleAlert } from 'lucide-react'

export function WeightTrackerSkeleton({
  label = 'Loading weight tracker',
}: {
  label?: string
}) {
  return (
    <div aria-label={label} aria-busy="true" className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  )
}

export function WeightTrackerErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-400/20 bg-[#111315] p-8 text-center"
    >
      <TriangleAlert
        className="mx-auto size-6 text-red-300"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 font-semibold text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </section>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center">
      <Dumbbell className="mx-auto size-7 text-lime-300" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}
