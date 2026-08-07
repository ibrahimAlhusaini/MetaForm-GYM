import { ArrowDown, ArrowUp } from 'lucide-react'

export function PlanReorderControls({
  index,
  total,
  upLabel,
  downLabel,
  onMove,
}: {
  index: number
  total: number
  upLabel: string
  downLabel: string
  onMove: (direction: -1 | 1) => void
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={upLabel}
        disabled={index === 0}
        onClick={() => {
          onMove(-1)
        }}
        className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
      >
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={downLabel}
        disabled={index === total - 1}
        onClick={() => {
          onMove(1)
        }}
        className="rounded-lg border border-white/10 p-2 disabled:opacity-30"
      >
        <ArrowDown className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
