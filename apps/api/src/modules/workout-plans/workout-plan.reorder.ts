import { AppError } from '../../utils/app-error.js'
import { REORDER_TEMPORARY_OFFSET } from './workout-plan.constants.js'

interface ReorderItem {
  id: string
  orderIndex: number
}

export const reorderCompleteSet = async (
  requested: readonly ReorderItem[],
  existingIds: readonly string[],
  shiftExisting: (offset: number) => Promise<unknown>,
  updateItem: (item: ReorderItem) => Promise<unknown>,
): Promise<void> => {
  const existing = new Set(existingIds)
  const requestedIds = new Set(requested.map((item) => item.id))
  const positions = [...requested.map((item) => item.orderIndex)].sort(
    (left, right) => left - right,
  )
  const isComplete =
    requested.length === existingIds.length &&
    requestedIds.size === existing.size &&
    [...requestedIds].every((id) => existing.has(id))
  const isContiguous = positions.every((position, index) => position === index)
  if (!isComplete || !isContiguous)
    throw new AppError(
      400,
      'Reorder request must contain the complete item set with contiguous positions',
    )
  await shiftExisting(REORDER_TEMPORARY_OFFSET)
  for (const item of requested) await updateItem(item)
}
