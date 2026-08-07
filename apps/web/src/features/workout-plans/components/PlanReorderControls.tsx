import { ArrowDown, ArrowUp } from 'lucide-react'

export function PlanReorderControls({
  index,
  total,
  upLabel,
  downLabel,
  onMove,
  disabled = false,
}: {
  index: number
  total: number
  upLabel: string
  downLabel: string
  onMove: (direction: -1 | 1) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={upLabel}
        disabled={disabled || index === 0}
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
        disabled={disabled || index === total - 1}
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
