export const moveItem = <T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] => {
  if (to < 0 || to >= items.length || from === to) return [...items]
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item !== undefined) next.splice(to, 0, item)
  return next
}
