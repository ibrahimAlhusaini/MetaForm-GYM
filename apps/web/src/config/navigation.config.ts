import {
  Bot,
  Calculator,
  CalendarDays,
  Dumbbell,
  House,
  Scale,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export const appRouteSegments = {
  weights: 'weights',
  exercises: 'exercises',
  aiCoach: 'ai-coach',
  calories: 'calories',
  plans: 'plans',
  profile: 'profile',
} as const

export const appPaths = {
  home: '/app',
  weights: `/app/${appRouteSegments.weights}`,
  exercises: `/app/${appRouteSegments.exercises}`,
  aiCoach: `/app/${appRouteSegments.aiCoach}`,
  calories: `/app/${appRouteSegments.calories}`,
  plans: `/app/${appRouteSegments.plans}`,
  profile: `/app/${appRouteSegments.profile}`,
} as const

export type AppNavigationId = keyof typeof appPaths

export interface AppNavigationItem {
  id: AppNavigationId
  path: (typeof appPaths)[AppNavigationId]
  labelKey: string
  pageTitleKey: string
  descriptionKey: string
  icon: LucideIcon
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  {
    id: 'home',
    path: appPaths.home,
    labelKey: 'items.home.label',
    pageTitleKey: 'items.home.title',
    descriptionKey: 'items.home.description',
    icon: House,
  },
  {
    id: 'weights',
    path: appPaths.weights,
    labelKey: 'items.weights.label',
    pageTitleKey: 'items.weights.title',
    descriptionKey: 'items.weights.description',
    icon: Scale,
  },
  {
    id: 'exercises',
    path: appPaths.exercises,
    labelKey: 'items.exercises.label',
    pageTitleKey: 'items.exercises.title',
    descriptionKey: 'items.exercises.description',
    icon: Dumbbell,
  },
  {
    id: 'aiCoach',
    path: appPaths.aiCoach,
    labelKey: 'items.aiCoach.label',
    pageTitleKey: 'items.aiCoach.title',
    descriptionKey: 'items.aiCoach.description',
    icon: Bot,
  },
  {
    id: 'calories',
    path: appPaths.calories,
    labelKey: 'items.calories.label',
    pageTitleKey: 'items.calories.title',
    descriptionKey: 'items.calories.description',
    icon: Calculator,
  },
  {
    id: 'plans',
    path: appPaths.plans,
    labelKey: 'items.plans.label',
    pageTitleKey: 'items.plans.title',
    descriptionKey: 'items.plans.description',
    icon: CalendarDays,
  },
  {
    id: 'profile',
    path: appPaths.profile,
    labelKey: 'items.profile.label',
    pageTitleKey: 'items.profile.title',
    descriptionKey: 'items.profile.description',
    icon: UserRound,
  },
]

export const getNavigationItem = (id: AppNavigationId): AppNavigationItem => {
  const item = appNavigationItems.find((candidate) => candidate.id === id)

  if (!item) {
    throw new Error(`Unknown application navigation item: ${id}`)
  }

  return item
}

export const getPageTitleKey = (pathname: string): string =>
  appNavigationItems.find(
    (item) =>
      item.path === pathname ||
      (item.path !== appPaths.home && pathname.startsWith(`${item.path}/`)),
  )?.pageTitleKey ?? 'notFound.title'
