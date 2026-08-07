import type { TFunction } from 'i18next'
import type {
  WorkoutPlanSummary,
  WorkoutPlanTemplateType,
} from '@metaform/shared-types'
import i18n from '../../../i18n/index.js'
import { localeForLanguage } from '../../../i18n/locale.js'
import { ownershipLabel } from '../../../i18n/enum-labels.js'

export const formatPlanDate = (value: string): string =>
  new Intl.DateTimeFormat(
    localeForLanguage(i18n.resolvedLanguage ?? i18n.language),
    { dateStyle: 'medium' },
  ).format(new Date(value))

export const planOwnershipLabel = (
  t: TFunction,
  plan: Pick<WorkoutPlanSummary, 'ownershipType' | 'templateType'>,
): string =>
  plan.templateType
    ? t(`labels.templateType.${plan.templateType}`)
    : ownershipLabel(t, plan.ownershipType)

export const templateTypeLabel = (
  t: TFunction,
  value: WorkoutPlanTemplateType,
): string => t(`labels.templateType.${value}`)
