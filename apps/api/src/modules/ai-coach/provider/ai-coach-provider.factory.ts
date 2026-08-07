import { env } from '../../../config/env.js'
import type { AiCoachProvider } from './ai-coach-provider.js'
import { AiCoachProviderError } from './ai-coach-provider.js'
import { OpenAiCoachProvider } from './openai-ai-coach.provider.js'

let cachedProvider: AiCoachProvider | undefined
let testProvider: AiCoachProvider | undefined
export const setAiCoachProviderForTests = (
  provider: AiCoachProvider | undefined,
): void => {
  if (env.NODE_ENV !== 'test')
    throw new Error('Test provider override is disabled')
  testProvider = provider
}
export const getAiCoachProvider = (): AiCoachProvider => {
  if (testProvider) return testProvider
  if (!env.OPENAI_API_KEY || !env.AI_COACH_MODEL)
    throw new AiCoachProviderError()
  cachedProvider ??= new OpenAiCoachProvider(
    env.OPENAI_API_KEY,
    env.AI_COACH_MODEL,
  )
  return cachedProvider
}
