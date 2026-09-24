export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function sample(items, count, random = Math.random) {
  const safeCount = Math.max(0, Math.min(Number(count) || 0, items.length));
  return shuffle(items, random).slice(0, safeCount);
}
