import { RefreshCw, TriangleAlert } from 'lucide-react'

interface DashboardErrorStateProps {
  message: string
  onRetry: () => void
}

export function DashboardErrorState({
  message,
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-[#111315] px-6 py-12 text-center sm:px-10"
    >
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-400/8 text-red-300">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-white">
        Dashboard unavailable
      </h1>
      <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-300"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </section>
  )
}
