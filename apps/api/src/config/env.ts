import 'dotenv/config'
import { z } from 'zod'

const durationSchema = z
  .string()
  .regex(/^\d+[smhd]$/, 'Duration must use s, m, h, or d units')
  .transform((value) => {
    const amount = Number.parseInt(value.slice(0, -1), 10)

    switch (value.at(-1)) {
      case 's':
        return amount
      case 'm':
        return amount * 60
      case 'h':
        return amount * 60 * 60
      case 'd':
        return amount * 60 * 60 * 24
      default:
        return 0
    }
  })
  .pipe(z.number().int().positive())

const optionalEnvironmentValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
)

const frontendOriginSchema = z
  .url()
  .superRefine((value, context) => {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      context.addIssue({
        code: 'custom',
        message: 'FRONTEND_URL must use http or https',
      })
    }
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      context.addIssue({
        code: 'custom',
        message: 'FRONTEND_URL must contain only an origin',
      })
    }
  })
  .transform((value) => new URL(value).origin)

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().max(65_535).default(3000),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .regex(/^postgres(?:ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL'),
    TEST_DATABASE_URL: z
      .string()
      .regex(
        /^postgres(?:ql)?:\/\//,
        'TEST_DATABASE_URL must be a PostgreSQL URL',
      )
      .optional(),
    FRONTEND_URL: frontendOriginSchema,
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: durationSchema.default(15 * 60),
    JWT_REFRESH_EXPIRES_IN: durationSchema.default(7 * 24 * 60 * 60),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
    COOKIE_NAME: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/)
      .default('metaform_refresh_token'),
    OPENAI_API_KEY: optionalEnvironmentValue,
    AI_COACH_MODEL: optionalEnvironmentValue,
    BODY_WEIGHT_PREDICTION_SERVICE_URL: z
      .url()
      .default('http://127.0.0.1:8001'),
    BODY_WEIGHT_PREDICTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(10_000)
      .default(2_000),
  })
  .refine(
    (value) => Boolean(value.OPENAI_API_KEY) === Boolean(value.AI_COACH_MODEL),
    {
      message: 'OPENAI_API_KEY and AI_COACH_MODEL must be configured together',
    },
  )

export const parseEnvironment = (input: Record<string, string | undefined>) =>
  environmentSchema.parse(input)

const parsedEnvironment = environmentSchema.safeParse(process.env)

if (!parsedEnvironment.success) {
  console.error(
    'Invalid environment configuration',
    z.treeifyError(parsedEnvironment.error),
  )
  throw new Error('Invalid environment configuration')
}

export const env = Object.freeze(parsedEnvironment.data)
