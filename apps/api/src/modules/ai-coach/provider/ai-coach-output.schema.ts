import { z } from 'zod'

const code = z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/)
export const aiCoachResultSchema = z
  .object({
    headline: z.string().trim().min(1).max(120),
    summary: z.string().trim().min(1).max(1500),
    findings: z
      .array(
        z
          .object({
            code,
            text: z.string().trim().min(1).max(500),
            severity: z.enum(['INFO', 'CAUTION']),
          })
          .strict(),
      )
      .max(6),
    recommendations: z
      .array(
        z
          .object({
            code,
            title: z.string().trim().min(1).max(120),
            description: z.string().trim().min(1).max(600),
            priority: z.number().int().min(1).max(5),
          })
          .strict(),
      )
      .max(5),
    evidence: z
      .array(
        z
          .object({
            metric: z.string().trim().min(1).max(80),
            value: z.union([
              z.string().max(200),
              z.number(),
              z.boolean(),
              z.null(),
            ]),
            unit: z.string().trim().max(30).nullable(),
          })
          .strict(),
      )
      .max(12),
    cautions: z.array(z.string().trim().min(1).max(400)).max(4),
  })
  .strict()
