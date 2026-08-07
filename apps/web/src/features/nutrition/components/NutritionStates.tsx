import { Calculator, RefreshCw, TriangleAlert } from 'lucide-react'

export function NutritionSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className="space-y-3"
    >
      <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  )
}

export function NutritionErrorState({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-400/20 bg-[#111315] p-6 text-center"
    >
      <TriangleAlert
        className="mx-auto size-6 text-red-300"
        aria-hidden="true"
      />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-semibold text-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        <RefreshCw className="size-4" aria-hidden="true" /> Try again
      </button>
    </section>
  )
}

export function NutritionEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-7 text-center">
      <Calculator className="mx-auto size-7 text-zinc-500" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
        {description}
      </p>
    </section>
  )
}
