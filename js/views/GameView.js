function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderGameShell({ title = '', icon = '🐝', subtitle = '', item = 1, total = 1, streak = 0, body = '' } = {}) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const safeItem = Math.max(1, Math.min(Number(item) || 1, safeTotal));
  const progress = Math.round(((safeItem - 1) / safeTotal) * 100);
  return `
    <main class="game-screen">
      <header class="game-toolbar">
        <button class="icon-button" type="button" data-action="home" aria-label="Back to missions">←</button>
        <div class="game-title-wrap"><span class="game-title-icon" aria-hidden="true">${icon}</span><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div></div>
        <div class="streak-pill" aria-label="Current streak ${Number(streak) || 0}">🔥 Streak ${Number(streak) || 0}</div>
      </header>
      <section class="game-progress" aria-label="Mission progress">
        <div class="game-progress-copy"><span>Item ${safeItem} of ${safeTotal}</span><span>${progress}%</span></div>
        <div class="progress-track"><span style="width:${progress}%"></span></div>
      </section>
      <section class="game-stage">${body}</section>
      <div id="liveFeedback" class="sr-live" aria-live="polite" aria-atomic="true"></div>
    </main>
  `;
}
