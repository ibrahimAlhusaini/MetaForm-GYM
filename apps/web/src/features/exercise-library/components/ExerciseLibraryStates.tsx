import { AlertTriangle, Dumbbell, LoaderCircle, SearchX } from 'lucide-react'

export function ExerciseLibrarySkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="py-16 text-center text-zinc-400"
    >
      <LoaderCircle
        className="mx-auto size-8 animate-spin text-lime-300"
        aria-hidden="true"
      />
      <p className="mt-4">{label}</p>
    </div>
  )
}

export function ExerciseLibraryErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center"
    >
      <AlertTriangle
        className="mx-auto size-8 text-red-300"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-xl font-semibold">Unable to load exercises</h2>
      <p className="mt-2 text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-xl bg-white px-5 font-semibold text-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
      >
        Try again
      </button>
    </div>
  )
}

export function ExerciseEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
      {filtered ? (
        <SearchX className="mx-auto size-9 text-zinc-500" aria-hidden="true" />
      ) : (
        <Dumbbell className="mx-auto size-9 text-zinc-500" aria-hidden="true" />
      )}
      <h2 className="mt-4 text-xl font-semibold">
        {filtered
          ? 'No exercises match these filters'
          : 'No published exercises yet'}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-400">
        {filtered
          ? 'Clear or adjust the filters to broaden your results.'
          : 'Published exercises will appear here when they become available.'}
      </p>
    </div>
  )
}
