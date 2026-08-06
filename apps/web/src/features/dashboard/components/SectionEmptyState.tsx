import type { LucideIcon } from 'lucide-react'

interface SectionEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function SectionEmptyState({
  icon: Icon,
  title,
  description,
}: SectionEmptyStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-8 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-white/5 text-zinc-500">
        <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  )
}
