export function toggleSurahOrder(order: number[], id: number): number[] {
  return order.includes(id) ? order.filter((value) => value !== id) : [...order, id];
}

export function moveSurah(order: number[], id: number, direction: -1 | 1): number[] {
  const index = order.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return order;
  const next = [...order];
  const adjacent = next[target];
  if (adjacent === undefined) return order;
  next[index] = adjacent;
  next[target] = id;
  return next;
}