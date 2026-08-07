import type {
  AiCoachCapabilityType,
  AiCoachLanguage,
  AiCoachResult,
} from '@metaform/shared-types'

export interface AiCoachProviderInput {
  type: AiCoachCapabilityType
  language: AiCoachLanguage
  systemPrompt: string
  capabilityPrompt: string
  context: unknown
}
export interface AiCoachProvider {
  generateStructuredCoachResponse(
    input: AiCoachProviderInput,
  ): Promise<AiCoachResult>
}
export class AiCoachProviderError extends Error {
  constructor() {
    super('AI coach provider unavailable')
    this.name = 'AiCoachProviderError'
  }
}
