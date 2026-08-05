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
  label: string
  pageTitle: string
  description: string
  icon: LucideIcon
}

export const appNavigationItems: readonly AppNavigationItem[] = [
  {
    id: 'home',
    path: appPaths.home,
    label: 'Home',
    pageTitle: 'Home',
    description: 'Dashboard analytics will be implemented in the next stage.',
    icon: House,
  },
  {
    id: 'weights',
    path: appPaths.weights,
    label: 'Weight Tracker',
    pageTitle: 'Weight Tracker',
    description: 'Body measurement history and progress trends will live here.',
    icon: Scale,
  },
  {
    id: 'exercises',
    path: appPaths.exercises,
    label: 'Exercise Videos',
    pageTitle: 'Exercise Videos',
    description:
      'The guided exercise library will be introduced in a future stage.',
    icon: Dumbbell,
  },
  {
    id: 'aiCoach',
    path: appPaths.aiCoach,
    label: 'AI Coach',
    pageTitle: 'AI Coach',
    description:
      'Coaching conversations and recommendations are intentionally postponed.',
    icon: Bot,
  },
  {
    id: 'calories',
    path: appPaths.calories,
    label: 'Calories',
    pageTitle: 'Calories Calculator',
    description:
      'Nutrition calculations will be implemented in a dedicated stage.',
    icon: Calculator,
  },
  {
    id: 'plans',
    path: appPaths.plans,
    label: 'Workout Plans',
    pageTitle: 'Workout Plans',
    description: 'Plan creation and scheduling tools will be added later.',
    icon: CalendarDays,
  },
  {
    id: 'profile',
    path: appPaths.profile,
    label: 'Profile',
    pageTitle: 'Profile',
    description:
      'Profile details are read-only until the profile stage is implemented.',
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

export const getPageTitle = (pathname: string): string =>
  appNavigationItems.find((item) => item.path === pathname)?.pageTitle ??
  'Page not found'
