import { spawn } from 'node:child_process'

const requiredEnvironment = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
]

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`${name} is required for database migrations`)
  }
}

const databaseUrl = new URL('postgresql://localhost')
databaseUrl.hostname = process.env.DATABASE_HOST
databaseUrl.port = process.env.DATABASE_PORT
databaseUrl.pathname = process.env.DATABASE_NAME
databaseUrl.username = process.env.DATABASE_USER
databaseUrl.password = process.env.DATABASE_PASSWORD
databaseUrl.searchParams.set('schema', 'public')
databaseUrl.searchParams.set('sslmode', 'require')

const migration = spawn(
  'node',
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  {
    env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
    stdio: 'inherit',
  },
)

migration.once('error', (error) => {
  console.error('Failed to start Prisma migration process', error)
  process.exitCode = 1
})

migration.once('exit', (code, signal) => {
  if (signal) {
    console.error(`Prisma migration process terminated by ${signal}`)
    process.exitCode = 1
    return
  }

  process.exitCode = code ?? 1
})
