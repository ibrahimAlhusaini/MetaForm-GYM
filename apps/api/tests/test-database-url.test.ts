import { describe, expect, it } from 'vitest'
import {
  assertSafeTestDatabaseUrl,
  configureTestDatabaseEnvironment,
} from '../scripts/test-db/safety.js'

const development = 'postgresql://developer:development@localhost/metaform_gym'
const safe = 'postgresql://tester:test-password@localhost/metaform_gym_test'

describe('test database URL safety', () => {
  it('requires TEST_DATABASE_URL without falling back to DATABASE_URL', () => {
    expect(() => assertSafeTestDatabaseUrl(undefined, development)).toThrow(
      'TEST_DATABASE_URL is required',
    )
    const environment = { DATABASE_URL: development }
    expect(() => configureTestDatabaseEnvironment(environment)).toThrow(
      'TEST_DATABASE_URL is required',
    )
    expect(environment.DATABASE_URL).toBe(development)
  })

  it('rejects the known development database and ambiguous names', () => {
    expect(() => assertSafeTestDatabaseUrl(development)).toThrow(
      'cannot target the development database',
    )
    expect(() =>
      assertSafeTestDatabaseUrl(
        'postgresql://tester:secret@localhost/metaform_testingish',
      ),
    ).toThrow('must contain a clear test marker')
  })

  it('rejects the same target and production-like hosts', () => {
    const developmentTest =
      'postgresql://developer:one@localhost/shared_test?schema=public'
    expect(() =>
      assertSafeTestDatabaseUrl(
        'postgresql://other:two@localhost:5432/shared_test',
        developmentTest,
      ),
    ).toThrow('cannot target the same database')
    expect(() =>
      assertSafeTestDatabaseUrl(
        'postgresql://tester:secret@prod.example.com/metaform_gym_test',
      ),
    ).toThrow('cannot target a production-like host')
  })

  it('accepts a clearly isolated local test database', () => {
    expect(assertSafeTestDatabaseUrl(safe, development)).toEqual({
      databaseName: 'metaform_gym_test',
      hostname: 'localhost',
    })
  })

  it('configures Prisma from the expected test URL', () => {
    const environment = { DATABASE_URL: development, TEST_DATABASE_URL: safe }
    configureTestDatabaseEnvironment(environment)
    expect(environment.DATABASE_URL).toBe(safe)
  })

  it('never includes credentials in validation errors', () => {
    const secret = 'credential-that-must-not-leak'
    let message = ''
    try {
      assertSafeTestDatabaseUrl(
        `postgresql://tester:${secret}@localhost/metaform_gym`,
      )
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).not.toContain(secret)
    expect(message).not.toContain('postgresql://')
  })
})
