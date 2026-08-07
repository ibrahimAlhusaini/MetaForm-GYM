import OpenAI from 'openai'
import { z } from 'zod'
import { AI_PROVIDER_TIMEOUT_MS } from '../ai-coach.constants.js'
import {
  type AiCoachProvider,
  type AiCoachProviderInput,
  AiCoachProviderError,
} from './ai-coach-provider.js'
import { aiCoachResultSchema } from './ai-coach-output.schema.js'

export class OpenAiCoachProvider implements AiCoachProvider {
  private readonly client: OpenAI
  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({
      apiKey,
      timeout: AI_PROVIDER_TIMEOUT_MS,
      maxRetries: 0,
      logLevel: 'off',
    })
  }
  async generateStructuredCoachResponse(input: AiCoachProviderInput) {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: input.systemPrompt,
        input: `${input.capabilityPrompt}\n\nAnalytics context:\n${JSON.stringify(input.context)}`,
        max_output_tokens: 2_500,
        store: false,
        text: {
          format: {
            type: 'json_schema',
            name: 'ai_coach_result',
            strict: true,
            schema: z.toJSONSchema(aiCoachResultSchema),
          },
        },
      })
      const decoded: unknown = JSON.parse(response.output_text)
      const result = aiCoachResultSchema.safeParse(decoded)
      if (!result.success) throw new AiCoachProviderError()
      return result.data
    } catch (error) {
      if (error instanceof AiCoachProviderError) throw error
      throw new AiCoachProviderError()
    }
  }
}
