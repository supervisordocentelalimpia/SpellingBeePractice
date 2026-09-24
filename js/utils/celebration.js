export function createCelebrationMarkup(kind = 'stars', count = 10) {
  const safeCount = Math.max(0, Math.min(24, Number(count) || 0));
  const symbols = kind === 'bees' ? ['🐝', '✨', '⭐'] : ['⭐', '✨', '💫'];
  return Array.from({ length: safeCount }, (_, index) => {
    const symbol = symbols[index % symbols.length];
    const x = (index * 37) % 100;
    const delay = (index % 6) * 0.05;
    return `<span class="celebration-particle" style="--x:${x}%;--delay:${delay}s" aria-hidden="true">${symbol}</span>`;
  }).join('');
}

export function celebrate(root, kind = 'stars', count = 10) {
  if (!root || typeof root.insertAdjacentHTML !== 'function') return;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const layer = root.ownerDocument?.createElement?.('div');
  if (!layer) return;
  layer.className = 'celebration-layer';
  layer.innerHTML = createCelebrationMarkup(kind, reduced ? Math.min(3, count) : count);
  root.appendChild(layer);
  setTimeout(() => layer.remove(), reduced ? 450 : 1500);
}
