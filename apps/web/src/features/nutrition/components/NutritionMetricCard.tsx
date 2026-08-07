import type { ReactNode } from 'react'

export function NutritionMetricCard({
  label,
  value,
  note,
  featured = false,
}: {
  label: string
  value: ReactNode
  note?: string
  featured?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        featured
          ? 'border-lime-300/35 bg-lime-300/[0.07]'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <p className="text-xs font-medium tracking-[0.12em] text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {note ? (
        <p className="mt-1 text-xs leading-5 text-zinc-400">{note}</p>
      ) : null}
    </div>
  )
}
