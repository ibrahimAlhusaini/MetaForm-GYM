import 'dotenv/config'
import { Client } from 'pg'
import { assertSafeTestDatabaseUrl } from './safety.js'

const main = async (): Promise<void> => {
  const testUrl = process.env.TEST_DATABASE_URL
  const target = assertSafeTestDatabaseUrl(testUrl, process.env.DATABASE_URL)
  if (!testUrl) throw new Error('TEST_DATABASE_URL is required')
  const adminUrl = new URL(testUrl)
  adminUrl.pathname = '/postgres'
  adminUrl.search = ''
  const client = new Client({ connectionString: adminUrl.toString() })
  await client.connect()
  try {
    const existing = await client.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [target.databaseName],
    )
    if (existing.rows[0]?.exists) {
      console.log(
        `Isolated test database "${target.databaseName}" already exists`,
      )
      return
    }
    const quotedName = `"${target.databaseName.replaceAll('"', '""')}"`
    await client.query(`CREATE DATABASE ${quotedName}`)
    console.log(`Created isolated test database "${target.databaseName}"`)
  } finally {
    await client.end()
  }
}

void main().catch(() => {
  console.error('Unable to create the isolated test database')
  process.exitCode = 1
})
