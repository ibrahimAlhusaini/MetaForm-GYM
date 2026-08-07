import type { TFunction } from 'i18next'

const number = (value: number, locale: string, digits = 0): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)

export const formatProfileAge = (
  value: number,
  locale: string,
  t: TFunction,
): string => t('summary.yearsOld', { value: number(value, locale) })

export const formatProfileHeight = (
  value: number,
  locale: string,
  t: TFunction,
): string => t('common:units.cm', { value: number(value, locale, 2) })

export const formatProfileWeight = (
  value: number,
  locale: string,
  t: TFunction,
): string => t('common:units.kg', { value: number(value, locale, 2) })

export const formatProfilePercentage = (
  value: number,
  locale: string,
  t: TFunction,
): string => t('common:units.percent', { value: number(value, locale) })
