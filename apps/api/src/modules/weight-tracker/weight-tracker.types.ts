import type { Prisma } from '../../generated/prisma/client.js'

export type TransactionClient = Prisma.TransactionClient
export type DatabaseClient =
  TransactionClient | typeof import('../../config/prisma.js').prisma
export type SourceType = 'exercise' | 'machine'

export interface SourceReference {
  exerciseId: string | null
  customMachineId: string | null
}

export interface PaginationInput {
  page: number
  limit: number
}

export interface PaginationMetadata extends PaginationInput {
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
