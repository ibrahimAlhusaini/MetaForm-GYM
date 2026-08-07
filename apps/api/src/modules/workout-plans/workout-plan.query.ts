import type { Prisma } from '../../generated/prisma/client.js'
import type {
  PlanListQuery,
  TemplateListQuery,
} from './workout-plan.validation.js'

const searchWhere = (
  search: string | undefined,
): Prisma.WorkoutPlanWhereInput =>
  search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {}

export const planListWhere = (
  userId: string,
  query: PlanListQuery,
): Prisma.WorkoutPlanWhereInput => ({
  AND: [
    query.ownership === 'mine'
      ? { userId }
      : query.ownership === 'public'
        ? { isPublic: true }
        : { OR: [{ userId }, { isPublic: true }] },
    searchWhere(query.search),
  ],
  ...(query.difficultyLevel ? { difficultyLevel: query.difficultyLevel } : {}),
  ...(query.isTemplate === undefined ? {} : { isTemplate: query.isTemplate }),
})

export const templateListWhere = (
  userId: string,
  query: TemplateListQuery,
): Prisma.WorkoutPlanWhereInput => ({
  AND: [{ OR: [{ userId }, { isPublic: true }] }, searchWhere(query.search)],
  isTemplate: true,
  ...(query.difficultyLevel ? { difficultyLevel: query.difficultyLevel } : {}),
})

export const planOrderBy = (
  sortBy: PlanListQuery['sortBy'],
  sortOrder: PlanListQuery['sortOrder'],
): Prisma.WorkoutPlanOrderByWithRelationInput[] => [
  { [sortBy]: sortOrder },
  { id: 'asc' },
]
