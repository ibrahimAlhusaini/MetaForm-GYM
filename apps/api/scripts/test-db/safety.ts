const TEST_DATABASE_MARKER = /(^|[_-])test($|[_-])/i
const PRODUCTION_LIKE_HOST = /(^|[.-])(prod|production|staging)([.-]|$)/i
const SAFE_DATABASE_NAME = /^[A-Za-z0-9_-]+$/
const KNOWN_DEVELOPMENT_DATABASES = new Set(['metaform_gym'])

export interface SafeTestDatabaseTarget {
  databaseName: string
  hostname: string
}

const invalid = (message: string): Error => new Error(message)

const parsePostgresUrl = (value: string, variableName: string): URL => {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw invalid(`${variableName} must be a valid PostgreSQL URL`)
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw invalid(`${variableName} must be a PostgreSQL URL`)
  }
  return parsed
}

const databaseName = (url: URL, variableName: string): string => {
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length !== 1) {
    throw invalid(`${variableName} must identify exactly one database`)
  }
  let decoded: string
  try {
    decoded = decodeURIComponent(segments[0] ?? '')
  } catch {
    throw invalid(`${variableName} contains an invalid database name`)
  }
  if (!SAFE_DATABASE_NAME.test(decoded)) {
    throw invalid(
      `${variableName} database name must use letters, numbers, _ or -`,
    )
  }
  return decoded
}

const normalizedTarget = (url: URL, name: string): string => {
  const port = url.port || '5432'
  return `${url.hostname.toLowerCase()}:${port}/${name.toLowerCase()}`
}

export const assertSafeTestDatabaseUrl = (
  value: string | undefined,
  developmentUrl?: string,
): SafeTestDatabaseTarget => {
  if (!value) {
    throw invalid(
      'TEST_DATABASE_URL is required for database integration tests',
    )
  }
  const parsed = parsePostgresUrl(value, 'TEST_DATABASE_URL')
  const name = databaseName(parsed, 'TEST_DATABASE_URL')
  const normalizedName = name.toLowerCase()
  if (KNOWN_DEVELOPMENT_DATABASES.has(normalizedName)) {
    throw invalid('TEST_DATABASE_URL cannot target the development database')
  }
  if (!TEST_DATABASE_MARKER.test(name)) {
    throw invalid(
      'TEST_DATABASE_URL database name must contain a clear test marker',
    )
  }
  if (PRODUCTION_LIKE_HOST.test(parsed.hostname)) {
    throw invalid('TEST_DATABASE_URL cannot target a production-like host')
  }
  if (developmentUrl) {
    const development = parsePostgresUrl(developmentUrl, 'DATABASE_URL')
    const developmentName = databaseName(development, 'DATABASE_URL')
    if (
      normalizedTarget(parsed, name) ===
      normalizedTarget(development, developmentName)
    ) {
      throw invalid(
        'TEST_DATABASE_URL cannot target the same database as DATABASE_URL',
      )
    }
  }
  return { databaseName: name, hostname: parsed.hostname }
}

export const configureTestDatabaseEnvironment = (
  environment: Record<string, string | undefined>,
): SafeTestDatabaseTarget => {
  const target = assertSafeTestDatabaseUrl(
    environment.TEST_DATABASE_URL,
    environment.DATABASE_URL,
  )
  environment.DATABASE_URL = environment.TEST_DATABASE_URL
  return target
}
