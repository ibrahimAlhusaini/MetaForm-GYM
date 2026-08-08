import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { assertSafeTestDatabaseUrl } from './safety.js'

const testUrl = process.env.TEST_DATABASE_URL
const target = assertSafeTestDatabaseUrl(testUrl, process.env.DATABASE_URL)
if (!testUrl) throw new Error('TEST_DATABASE_URL is required')

console.log(
  `Resetting isolated test database "${target.databaseName}" and applying migrations`,
)
const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'npm'
const npmArguments = isWindows
  ? ['/d', '/s', '/c', 'npm.cmd exec prisma -- migrate reset --force']
  : ['exec', 'prisma', '--', 'migrate', 'reset', '--force']
const result = spawnSync(npmCommand, npmArguments, {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: testUrl },
  stdio: 'inherit',
})
if (result.error || result.status !== 0) {
  throw new Error('Test database migration reset failed')
}
