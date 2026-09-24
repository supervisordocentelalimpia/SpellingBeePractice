function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function renderLetterRescue({ word = '', targetLetter = '', canRecognize = false } = {}) {
  const letter = escapeHtml(String(targetLetter).toUpperCase().slice(0, 1));
  const uppercaseWord = escapeHtml(String(word).toUpperCase());
  return `
    <div class="rescue-card">
      <div class="rescue-badge">🐝 LETTER RESCUE</div>
      <h2>One letter needs a little practice.</h2>
      <p class="rescue-word">We're helping <strong>${uppercaseWord}</strong>.</p>
      <button class="rescue-letter" type="button" data-action="listen-letter" aria-label="Tap ${letter} to listen to the letter name">
        <span class="rescue-spark" aria-hidden="true">✨</span>
        <strong>${letter}</strong>
        <small>Tap ${letter} to listen 🔊</small>
      </button>
      <p class="rescue-instruction">Listen to the letter name, then say the same letter.</p>
      <button class="btn btn-primary mic-button" type="button" data-action="repeat-letter"${canRecognize ? '' : ' disabled'}>
        <span aria-hidden="true">🎤</span> Repeat ${letter}
      </button>
      ${canRecognize ? '' : '<p class="support-note">Microphone spelling is not available here. You can still tap the letter and listen.</p>'}
      <div class="rescue-feedback" data-role="rescue-feedback" aria-live="polite"></div>
    </div>
  `;
}
