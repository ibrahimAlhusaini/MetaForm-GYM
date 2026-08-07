import i18n from '../../../i18n/index.js'
import {
  muscleLabel,
  sessionStatusLabel,
  sourceTypeLabel,
} from '../../../i18n/enum-labels.js'
import { localeForLanguage } from '../../../i18n/locale.js'
import type { MuscleGroup, SourceType } from '../types/weight-tracker.types.js'

const locale = () => localeForLanguage(i18n.resolvedLanguage ?? i18n.language)
const number = (value: number) =>
  new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(value)
export const formatKg = (value: number | null): string =>
  value === null
    ? i18n.t('states.unavailable', { ns: 'common' })
    : i18n.t('units.kg', { ns: 'common', value: number(value) })
export const formatVolume = (value: number): string =>
  i18n.t('units.kg', { ns: 'common', value: number(value) })
export const formatDuration = (minutes: number | null): string =>
  minutes === null
    ? i18n.t('sessions.durationInProgress', { ns: 'weightTracker' })
    : i18n.t('units.minutes', { ns: 'common', value: number(minutes) })
export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(
    new Date(value),
  )
export const formatDateTime = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat(locale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : i18n.t('sessions.notCompleted', { ns: 'weightTracker' })
export const formatMuscle = (value: MuscleGroup | null | undefined): string =>
  value
    ? muscleLabel(i18n.t, value)
    : i18n.t('states.notSpecified', { ns: 'common' })
export const formatSourceType = (value: SourceType): string =>
  sourceTypeLabel(i18n.t, value === 'machine' ? 'CUSTOM_MACHINE' : 'EXERCISE')
export const sessionStatus = (completedAt: string | null): string =>
  sessionStatusLabel(i18n.t, Boolean(completedAt))
export const paginationLabel = (page: number, totalPages: number): string =>
  totalPages === 0
    ? i18n.t('states.noPages', { ns: 'common' })
    : i18n.t('states.pageOf', { ns: 'common', page, totalPages })
export const toDateTimeLocal = (iso?: string): string => {
  const date = iso ? new Date(iso) : new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
