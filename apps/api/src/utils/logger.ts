type LogValue = string | number | boolean | null | undefined

const write = (
  level: 'info' | 'error',
  event: string,
  metadata: Record<string, LogValue> = {},
): void => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...metadata,
  })
  if (level === 'error') console.error(entry)
  else console.log(entry)
}

export const logInfo = (
  event: string,
  metadata?: Record<string, LogValue>,
): void => {
  write('info', event, metadata)
}

export const logError = (
  event: string,
  metadata?: Record<string, LogValue>,
): void => {
  write('error', event, metadata)
}
