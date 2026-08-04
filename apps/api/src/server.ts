import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

const server = app.listen(env.PORT, () => {
  console.log(`MetaForm API listening on http://localhost:${String(env.PORT)}`)
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
  console.log(`${signal} received. Closing HTTP server.`)

  let exitCode = 0

  try {
    await closeHttpServer()
  } catch {
    console.error('Failed to close HTTP server cleanly')
    exitCode = 1
  }

  try {
    await prisma.$disconnect()
  } catch {
    console.error('Failed to disconnect the database client cleanly')
    exitCode = 1
  }

  process.exit(exitCode)
}

process.on('SIGINT', (signal) => {
  void shutdown(signal)
})

process.on('SIGTERM', (signal) => {
  void shutdown(signal)
})
