import {
  ArrowDownRight,
  ArrowUpRight,
  CircleEllipsis,
  Minus,
} from 'lucide-react'
import type { BodyWeightTrendDirection } from '@metaform/shared-types'
import { useTranslation } from 'react-i18next'
import {
  formatSignedPercentage,
  formatSignedWeight,
  formatTrendDirection,
} from '../utils/dashboard-formatters.js'

interface TrendSummaryProps {
  direction: BodyWeightTrendDirection | null
  changeKg: number | null
  percentageChange: number | null
}

const renderTrendIcon = (direction: BodyWeightTrendDirection | null) => {
  const className = 'size-4'

  if (direction === 'INCREASING') {
    return <ArrowUpRight className={className} aria-hidden="true" />
  }
  if (direction === 'DECREASING') {
    return <ArrowDownRight className={className} aria-hidden="true" />
  }
  if (direction === 'STABLE') {
    return <Minus className={className} aria-hidden="true" />
  }
  return <CircleEllipsis className={className} aria-hidden="true" />
}

export function TrendSummary({
  direction,
  changeKg,
  percentageChange,
}: TrendSummaryProps) {
  const { t } = useTranslation('dashboard')
  const directionLabel = direction
    ? formatTrendDirection(direction)
    : changeKg === null
      ? t('trend.previousUnavailable')
      : t('trend.loadChange')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
      <span className="inline-flex items-center gap-2 text-zinc-300">
        {renderTrendIcon(direction)}
        {directionLabel}
      </span>
      {changeKg === null ? null : (
        <span>
          {t('trend.change', { value: formatSignedWeight(changeKg) })}
        </span>
      )}
      {percentageChange === null ? null : (
        <span>({formatSignedPercentage(percentageChange)})</span>
      )}
    </div>
  )
}
