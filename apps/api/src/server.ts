import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { logError, logInfo } from './utils/logger.js'

const SHUTDOWN_DEADLINE_MS = 10_000

const server = app.listen(env.PORT, () => {
  logInfo('api_started', { port: env.PORT, environment: env.NODE_ENV })
})

let isShuttingDown = false

const closeHttpServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  logInfo('api_shutdown_started', { signal })

  let exitCode = 0
  const forceClose = setTimeout(() => {
    logError('api_shutdown_deadline_exceeded', {
      deadlineMs: SHUTDOWN_DEADLINE_MS,
    })
    server.closeAllConnections()
  }, SHUTDOWN_DEADLINE_MS)
  forceClose.unref()

  try {
    await closeHttpServer()
  } catch {
    logError('api_http_shutdown_failed')
    exitCode = 1
  }

  try {
    await prisma.$disconnect()
  } catch {
    logError('api_database_shutdown_failed')
    exitCode = 1
  }

  clearTimeout(forceClose)
  logInfo('api_shutdown_completed', { exitCode })
  process.exit(exitCode)
}

process.on('SIGINT', (signal) => {
  void shutdown(signal)
})

process.on('SIGTERM', (signal) => {
  void shutdown(signal)
})
