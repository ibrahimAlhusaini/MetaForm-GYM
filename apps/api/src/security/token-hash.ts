import { createHash, timingSafeEqual } from 'node:crypto'

export const hashRefreshToken = (token: string): string => {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export const refreshTokenHashesMatch = (
  token: string,
  storedHash: string,
): boolean => {
  const actualHash = Buffer.from(hashRefreshToken(token), 'hex')
  const expectedHash = Buffer.from(storedHash, 'hex')

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  )
}
