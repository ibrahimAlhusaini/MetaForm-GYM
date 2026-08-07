import type {
  BodyWeightTrendDirection,
  DashboardMuscleGroup,
  StrengthSourceType,
} from '@metaform/shared-types'
import i18n from '../../../i18n/index.js'
import { localeForLanguage } from '../../../i18n/locale.js'
import {
  muscleLabel,
  sourceTypeLabel,
  trendLabel,
} from '../../../i18n/enum-labels.js'

const locale = () => localeForLanguage(i18n.resolvedLanguage ?? i18n.language)
const number = (value: number, digits = 2) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(
    value,
  )
const parseDate = (value: string): Date | null => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatWeight = (value: number): string =>
  i18n.t('units.kg', { ns: 'common', value: number(value) })
export const formatCalories = (value: number): string =>
  i18n.t('units.kcal', { ns: 'common', value: number(value, 0) })
export const formatDuration = (minutes: number): string =>
  i18n.t('units.minutes', { ns: 'common', value: number(minutes, 0) })
export const formatCount = (
  value: number,
  unit:
    'days' | 'workouts' | 'sessions' | 'measurements' | 'representativePoints',
): string => i18n.t(`counts.${unit}`, { ns: 'dashboard', count: value })
export const formatSignedWeight = (value: number): string =>
  i18n.t('units.kg', {
    ns: 'common',
    value: `${value > 0 ? '+' : ''}${number(value)}`,
  })
export const formatSignedPercentage = (value: number): string =>
  i18n.t('units.percent', {
    ns: 'common',
    value: `${value > 0 ? '+' : ''}${number(value)}`,
  })
export const formatDateTime = (value: string): string => {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat(locale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : i18n.t('header.updateUnavailable', { ns: 'dashboard' })
}
export const formatChartDate = (value: string): string => {
  const date = parseDate(`${value}T00:00:00.000Z`)
  return date
    ? new Intl.DateTimeFormat(locale(), {
        month: 'short',
        day: 'numeric',
      }).format(date)
    : value
}
export const formatTrendDirection = (
  direction: BodyWeightTrendDirection,
): string => trendLabel(i18n.t, direction)
export const formatMuscleGroup = (muscle: DashboardMuscleGroup): string =>
  muscleLabel(i18n.t, muscle)
export const formatSourceType = (sourceType: StrengthSourceType): string =>
  sourceTypeLabel(i18n.t, sourceType)
