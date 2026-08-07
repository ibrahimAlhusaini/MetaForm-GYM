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

export const paginationMetadata = (
  input: PaginationInput,
  totalItems: number,
): PaginationMetadata => {
  const totalPages = Math.ceil(totalItems / input.limit)
  return {
    page: input.page,
    limit: input.limit,
    totalItems,
    totalPages,
    hasNextPage: input.page < totalPages,
    hasPreviousPage: input.page > 1,
  }
}

export const paginationSkip = ({ page, limit }: PaginationInput): number =>
  (page - 1) * limit
