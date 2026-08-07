import type { AiCoachSessionDetail } from '@metaform/shared-types'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from '../../utils/pagination.js'
import {
  AI_ANALYTICS_VERSION,
  AI_CONTEXT_SCHEMA_VERSION,
  AI_COACH_CAPABILITIES,
  AI_DATA_WINDOW_DAYS,
  COACH_VERSION,
} from './ai-coach.constants.js'
import { buildAiCoachContext } from './context/ai-coach-context.js'
import {
  mapAiCoachSessionDetail,
  mapAiCoachSessionSummary,
} from './ai-coach.mapper.js'
import {
  AI_COACH_SYSTEM_PROMPT,
  buildCapabilityPrompt,
} from './prompts/ai-coach.prompts.js'
import { getAiCoachProvider } from './provider/ai-coach-provider.factory.js'
import { AiCoachProviderError } from './provider/ai-coach-provider.js'
import type {
  AiCoachHistoryInput,
  CreateAiCoachSessionInput,
} from './ai-coach.validation.js'

const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  z.record(z.string(), z.json()).parse(value)
const selectionFromInput = (input: CreateAiCoachSessionInput) => {
  if ('selection' in input) {
    return input.type === 'WORKOUT_PLAN_REVIEW'
      ? { workoutPlanId: input.selection.workoutPlanId }
      : input.selection
  }
  return null
}
const dataWindowFor = (input: CreateAiCoachSessionInput): number | null => {
  if (input.type === 'WORKOUT_PLAN_REVIEW') return null
  if (input.type === 'WEEKLY_SUMMARY') return 7
  return AI_DATA_WINDOW_DAYS
}
export const listAiCoachCapabilities = () => [...AI_COACH_CAPABILITIES]
export const createAiCoachSession = async (
  userId: string,
  input: CreateAiCoachSessionInput,
  now = new Date(),
): Promise<AiCoachSessionDetail> => {
  const context = await buildAiCoachContext(userId, input, now)
  const metadata = {
    dataWindowDays: dataWindowFor(input),
    analyticsVersion: AI_ANALYTICS_VERSION,
    coachVersion: COACH_VERSION,
  }
  const answers = toInputJson({
    schemaVersion: AI_CONTEXT_SCHEMA_VERSION,
    type: input.type,
    language: input.language,
    selection: selectionFromInput(input),
    context,
  })
  const session = await prisma.aiCoachSession.create({
    data: { userId, answers, startedAt: now },
    select: { id: true },
  })
  try {
    const result = await getAiCoachProvider().generateStructuredCoachResponse({
      type: input.type,
      language: input.language,
      systemPrompt: AI_COACH_SYSTEM_PROMPT,
      capabilityPrompt: buildCapabilityPrompt(input.type, input.language),
      context,
    })
    const completed = await prisma.aiCoachSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        recommendations: toInputJson({ result, metadata }),
        completedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        answers: true,
        recommendations: true,
        startedAt: true,
        completedAt: true,
      },
    })
    return mapAiCoachSessionDetail(completed)
  } catch (error) {
    await prisma.aiCoachSession.update({
      where: { id: session.id },
      data: { status: 'ABANDONED', completedAt: new Date() },
    })
    if (error instanceof AiCoachProviderError)
      throw new AppError(503, 'AI Coach is temporarily unavailable')
    throw error
  }
}
const sessionSelect = {
  id: true,
  status: true,
  answers: true,
  recommendations: true,
  startedAt: true,
  completedAt: true,
} as const
export const listAiCoachSessions = async (
  userId: string,
  query: AiCoachHistoryInput,
) => {
  const where: Prisma.AiCoachSessionWhereInput = {
    userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { answers: { path: ['type'], equals: query.type } } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          startedAt: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          },
        }
      : {}),
  }
  const [items, totalItems] = await Promise.all([
    prisma.aiCoachSession.findMany({
      where,
      orderBy: [{ startedAt: query.sortOrder }, { id: query.sortOrder }],
      skip: paginationSkip(query),
      take: query.limit,
      select: sessionSelect,
    }),
    prisma.aiCoachSession.count({ where }),
  ])
  return {
    items: items.map(mapAiCoachSessionSummary),
    pagination: paginationMetadata(query, totalItems),
  }
}
export const getAiCoachSession = async (userId: string, sessionId: string) => {
  const row = await prisma.aiCoachSession.findFirst({
    where: { id: sessionId, userId },
    select: sessionSelect,
  })
  if (!row) throw new AppError(404, 'Resource not found')
  return mapAiCoachSessionDetail(row)
}
