import 'dotenv/config'

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for integration tests')
}

const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '')

if (!databaseName.endsWith('_test')) {
  throw new Error('Integration tests require a database name ending in _test')
}

process.env.DATABASE_URL = testDatabaseUrl
process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.JWT_ACCESS_SECRET =
  'test-access-secret-not-for-production-use-00000000000000000000'
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-not-for-production-use-0000000000000000000'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.BCRYPT_ROUNDS = '4'
process.env.COOKIE_NAME = 'metaform_refresh_token'
