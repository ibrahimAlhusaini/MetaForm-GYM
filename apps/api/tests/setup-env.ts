import 'dotenv/config'
import { configureTestDatabaseEnvironment } from '../scripts/test-db/safety.js'

configureTestDatabaseEnvironment(process.env)
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
