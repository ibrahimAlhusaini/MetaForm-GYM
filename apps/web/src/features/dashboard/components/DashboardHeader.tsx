import { Clock3 } from 'lucide-react'
import { formatDateTime } from '../utils/dashboard-formatters.js'

interface DashboardHeaderProps {
  firstName: string
  generatedAt: string
}

export function DashboardHeader({
  firstName,
  generatedAt,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/8 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-lime-300 uppercase">
          Training overview
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
          Review your latest training, body-weight, and strength activity in one
          focused view.
        </p>
      </div>
      <p className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
        <Clock3 className="size-4" aria-hidden="true" />
        Updated {formatDateTime(generatedAt)}
      </p>
    </header>
  )
}
