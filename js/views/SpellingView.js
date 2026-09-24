function tiles(letters, className = '') {
  return letters.map((letter) => `<span class="letter-tile ${className}">${letter}</span>`).join('');
}

export function renderSpellingAttempt({ word = '', emoji = '🐝', heardLetters = [], alignment = null } = {}) {
  const expectedTiles = alignment?.operations?.length
    ? alignment.operations
        .filter((op) => op.expected)
        .map((op) => {
          const stateClass = op.type === 'match' ? 'is-match' : 'needs-rescue';
          return `<span class="letter-tile ${stateClass}" data-index="${op.expectedIndex}">${op.expected}</span>`;
        }).join('')
    : tiles([...String(word).toUpperCase()]);

  return `
    <div class="spelling-review">
      <span class="prompt-emoji" aria-hidden="true">${emoji}</span>
      <p class="section-kicker">I heard</p>
      <div class="letter-row heard-row" aria-label="Letters the app heard">${heardLetters.length ? tiles(heardLetters, 'heard') : '<span class="empty-heard">No clear letters yet</span>'}</div>
      <div class="review-divider"><span>LET'S CHECK IT</span></div>
      <div class="letter-row expected-row" aria-label="Expected spelling">${expectedTiles}</div>
    </div>
  `;
}
