import { ArrowUpRight, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import type { Machine } from '../types/weight-tracker.types.js'
import { formatMuscle } from '../utils/formatters.js'
import { MachineImage } from './MachineImage.js'

export function MachineCard({ machine }: { machine: Machine }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/8 bg-[#111315]">
      <MachineImage
        imageUrl={machine.imageUrl}
        name={machine.name}
        className="aspect-[16/9] w-full"
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">{machine.name}</h3>
            <p className="mt-1 text-sm text-lime-300">
              {formatMuscle(machine.targetMuscle)}
            </p>
          </div>
          <Link
            to={`/app/weights/machines/${machine.id}`}
            aria-label={`Edit ${machine.name}`}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-lime-300"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
        {machine.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
            {machine.description}
          </p>
        ) : null}
        <Link
          to={`/app/weights/history/machine/${machine.id}`}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-200 hover:text-lime-300"
        >
          View strength history
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  )
}
