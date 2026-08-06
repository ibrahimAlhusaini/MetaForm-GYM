import { ImageOff } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { StrengthProgressItem } from '@metaform/shared-types'
import {
  formatCount,
  formatMuscleGroup,
  formatSourceType,
  formatWeight,
} from '../utils/dashboard-formatters.js'
import { TrendSummary } from './TrendSummary.js'
import { WeightChartTooltip } from './WeightChartTooltip.js'

interface StrengthProgressCardProps {
  item: StrengthProgressItem
}

export function StrengthProgressCard({ item }: StrengthProgressCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/8 bg-[#111315]">
      <div className="flex gap-4 border-b border-white/7 p-5">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={`${item.name} equipment`}
            className="size-14 shrink-0 rounded-xl border border-white/8 object-cover"
          />
        ) : (
          <span
            role="img"
            aria-label={`${item.name} image unavailable`}
            className="grid size-14 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.025] text-zinc-600"
          >
            <ImageOff className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{item.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-[0.68rem] font-medium tracking-wide uppercase">
            <span className="rounded-full border border-lime-300/15 bg-lime-300/5 px-2.5 py-1 text-lime-300">
              {formatSourceType(item.sourceType)}
            </span>
            <span className="rounded-full border border-white/8 px-2.5 py-1 text-zinc-500">
              {formatMuscleGroup(item.targetMuscle)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Personal record</dt>
            <dd className="mt-1 font-semibold text-zinc-100">
              {formatWeight(item.personalRecordKg)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Latest load</dt>
            <dd className="mt-1 font-semibold text-zinc-100">
              {formatWeight(item.latestWeightKg)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Previous load</dt>
            <dd className="mt-1 text-zinc-300">
              {item.previousWeightKg === null
                ? 'Not available'
                : formatWeight(item.previousWeightKg)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Qualifying history</dt>
            <dd className="mt-1 text-zinc-300">
              {formatCount(item.totalSessions, 'sessions')}
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-white/7 pt-4">
          <TrendSummary
            direction={null}
            changeKg={item.changeKg}
            percentageChange={item.percentageChange}
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-500">
          {formatCount(item.points.length, 'points', 'representative session')}.
          Latest load {formatWeight(item.latestWeightKg)}.
        </p>
        <div
          role="img"
          aria-label={`${item.name} load progression chart. Values are summarized in text above.`}
          className="mt-3 h-28 min-w-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={item.points}
              accessibilityLayer
              margin={{ top: 8, right: 4, bottom: 4, left: 4 }}
            >
              <Tooltip content={WeightChartTooltip} cursor={false} />
              <Line
                type="linear"
                dataKey="weightKg"
                stroke="#d9f94b"
                strokeWidth={2}
                connectNulls={false}
                isAnimationActive={false}
                dot={{
                  r: item.points.length === 1 ? 4 : 2.5,
                  fill: '#d9f94b',
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 4,
                  fill: '#d9f94b',
                  stroke: '#111315',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  )
}
