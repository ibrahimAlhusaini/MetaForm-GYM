import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error-handler.js'
import { notFoundHandler } from './middlewares/not-found.js'
import { apiRouter } from './routes/index.js'

export const app = express()

app.disable('x-powered-by')
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}
app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())
app.use('/api/v1', apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)
