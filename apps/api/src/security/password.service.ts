import bcrypt from 'bcrypt'
import { env } from '../config/env.js'

const dummyPasswordHash = bcrypt.hash(
  'MetaFormTimingDefensePassword123!',
  env.BCRYPT_ROUNDS,
)

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS)
}

export const verifyPassword = async (
  password: string,
  passwordHash?: string,
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash ?? (await dummyPasswordHash))
}
