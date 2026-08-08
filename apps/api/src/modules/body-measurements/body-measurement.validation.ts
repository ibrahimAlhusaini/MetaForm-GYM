import { z } from 'zod'
import { BODY_MEASUREMENT_LIMITS } from './body-measurement.constants.js'

export const createBodyMeasurementSchema = z
  .object({
    measuredAt: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value))
      .refine(
        (value) => value <= new Date(),
        'Measurement cannot be future-dated',
      ),
    weightKg: z
      .number()
      .min(BODY_MEASUREMENT_LIMITS.minimumWeightKg)
      .max(BODY_MEASUREMENT_LIMITS.maximumWeightKg)
      .multipleOf(0.01),
  })
  .strict()

export const bodyMeasurementHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(BODY_MEASUREMENT_LIMITS.maximumHistoryLimit)
      .default(BODY_MEASUREMENT_LIMITS.defaultHistoryLimit),
  })
  .strict()

export type CreateBodyMeasurementInput = z.infer<
  typeof createBodyMeasurementSchema
>
export type BodyMeasurementHistoryInput = z.infer<
  typeof bodyMeasurementHistoryQuerySchema
>
