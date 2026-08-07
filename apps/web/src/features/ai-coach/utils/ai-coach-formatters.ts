import type {
  AiCoachCapabilityType,
  AiCoachEvidence,
  AiCoachSessionStatus,
} from '@metaform/shared-types'
import type { TFunction } from 'i18next'

export const formatAiCoachDate = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export const formatEvidenceValue = (
  evidence: AiCoachEvidence,
  locale: string,
  t: TFunction,
): string => {
  const value: string =
    typeof evidence.value === 'number'
      ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
          evidence.value,
        )
      : typeof evidence.value === 'boolean'
        ? t(evidence.value ? 'values.yes' : 'values.no')
        : (evidence.value ?? t('common:states.unavailable'))
  return evidence.unit ? `${value} ${evidence.unit}` : value
}

export const capabilityLabel = (
  t: TFunction,
  type: AiCoachCapabilityType,
): string => t(`capabilities.${type}.title`)

export const coachStatusLabel = (
  t: TFunction,
  status: AiCoachSessionStatus,
): string => t(`statuses.${status}`)
