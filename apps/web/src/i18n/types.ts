import 'i18next'

export const translationNamespaces = [
  'common',
  'auth',
  'navigation',
  'dashboard',
  'weightTracker',
  'exerciseLibrary',
  'nutrition',
  'workoutPlans',
  'profile',
] as const

export type TranslationNamespace = (typeof translationNamespaces)[number]

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    returnNull: false
  }
}
