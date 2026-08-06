import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  isUnavailable?: boolean
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  isUnavailable = false,
}: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-white/8 bg-[#111315] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-zinc-500 uppercase">
            {label}
          </p>
          <p
            className={`mt-4 text-2xl font-semibold tracking-[-0.03em] ${isUnavailable ? 'text-zinc-500' : 'text-zinc-50'}`}
          >
            {value}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-lime-300/10 bg-lime-300/6 text-lime-300">
          <Icon
            className="size-[1.15rem]"
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-zinc-500">{detail}</p>
    </article>
  )
}
