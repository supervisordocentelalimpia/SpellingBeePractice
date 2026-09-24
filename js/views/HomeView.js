const MISSIONS = [
  { id: 'sound', number: 1, icon: '👂', title: 'Sound Detective', subtitle: 'Listen closely and build the word.', accent: 'sky' },
  { id: 'spell', number: 2, icon: '🎤', title: 'Spell It Out!', subtitle: 'Hear the word, then spell it aloud.', accent: 'gold' },
  { id: 'voice', number: 3, icon: '🗣️', title: 'Voice Challenge', subtitle: 'Listen, say the whole word, and check it.', accent: 'mint' },
  { id: 'match', number: 4, icon: '🧠', title: 'Word Match', subtitle: 'Match the picture to the right word.', accent: 'pink' },
  { id: 'builder', number: 5, icon: '✏️', title: 'Word Builder', subtitle: 'Find the missing letters and repair the word.', accent: 'violet' },
  { id: 'arena', number: 6, icon: '🏆', title: 'Bee Arena', subtitle: 'Practice a real Spelling Bee round.', accent: 'coral' }
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function voiceKey(voice) {
  return String(voice?.voiceURI || voice?.name || '');
}

export function renderHome({
  voices = [],
  selectedVoice = null,
  rewards = { stars: 0, honeycomb: 0, badges: [], stats: { practiced: 0 } },
  speechRecognitionAvailable = false,
  speechSynthesisAvailable = false
} = {}) {
  const selectedKey = voiceKey(selectedVoice);
  const voiceOptions = voices.length
    ? voices.slice(0, 5).map((voice) => {
        const key = voiceKey(voice);
        return `<option value="${escapeHtml(key)}"${key === selectedKey ? ' selected' : ''}>${escapeHtml(voice.name)}</option>`;
      }).join('')
    : '<option value="">Loading American English voices…</option>';

  const missionCards = MISSIONS.map((mission) => `
    <button class="mission-card accent-${mission.accent}" type="button" data-mission="${mission.id}" aria-label="Start ${escapeHtml(mission.title)} mission">
      <span class="mission-number" aria-hidden="true">${mission.number}</span>
      <span class="mission-icon" aria-hidden="true">${mission.icon}</span>
      <span class="mission-copy">
        <strong>${escapeHtml(mission.title)}</strong>
        <small>${escapeHtml(mission.subtitle)}</small>
      </span>
      <span class="mission-arrow" aria-hidden="true">→</span>
    </button>
  `).join('');

  const honeycomb = Array.from({ length: 12 }, (_, index) => (
    `<span class="honey-cell${index < (rewards.honeycomb || 0) ? ' filled' : ''}" aria-hidden="true">⬢</span>`
  )).join('');

  const badges = rewards.badges?.length
    ? rewards.badges.map((badge) => `<span class="badge-chip">🏅 ${escapeHtml(badge)}</span>`).join('')
    : '<span class="badge-chip quiet">Your first badge is waiting!</span>';

  const micStatus = speechRecognitionAvailable
    ? '<span class="status-dot good"></span> Microphone practice ready'
    : '<span class="status-dot warm"></span> Spoken missions need Chrome/Edge speech recognition';

  const voiceDisabled = !speechSynthesisAvailable || !voices.length;

  return `
    <main class="home-screen">
      <section class="hero-section" aria-labelledby="homeTitle">
        <div class="brand-pill"><span aria-hidden="true">🐝</span> CEVAZ · KIDS · LEVEL 1</div>
        <div class="hero-bee" aria-hidden="true"><span>🐝</span></div>
        <p class="eyebrow">SPELL · LISTEN · PLAY</p>
        <h1 id="homeTitle">Spelling Bee<br><span>Adventure Lab</span></h1>
        <p class="hero-copy">Train your ears. Train your spelling. Rescue letters and become a <strong>Spelling Bee Star!</strong></p>
        <div class="hero-status" aria-label="Browser speech status">${micStatus}</div>
      </section>

      <section class="dashboard-strip" aria-label="Your Bee progress">
        <div class="progress-stat"><span class="progress-icon">⭐</span><div><strong>${Number(rewards.stars) || 0}</strong><small>Bee Stars</small></div></div>
        <div class="progress-stat"><span class="progress-icon">🎯</span><div><strong>${Number(rewards.stats?.practiced) || 0}</strong><small>Words practiced</small></div></div>
        <div class="honey-progress" aria-label="Honeycomb progress ${Number(rewards.honeycomb) || 0} of 12">
          <div class="honey-label"><strong>Honeycomb Journey</strong><small>${Number(rewards.honeycomb) || 0}/12</small></div>
          <div class="honey-row">${honeycomb}</div>
        </div>
      </section>

      <section class="pronouncer-card" aria-labelledby="pronouncerTitle">
        <div class="pronouncer-visual" aria-hidden="true">🎙️</div>
        <div class="pronouncer-copy">
          <p class="section-kicker">YOUR PRONOUNCER</p>
          <h2 id="pronouncerTitle">Choose an American English voice</h2>
          <p>Pick the voice you want to hear during every mission.</p>
        </div>
        <div class="pronouncer-controls">
          <label for="voiceSelect">Pronouncer voice</label>
          <select id="voiceSelect"${voiceDisabled ? ' disabled' : ''}>${voiceOptions}</select>
          <button class="btn btn-secondary" type="button" data-action="preview-voice"${voiceDisabled ? ' disabled' : ''}>
            <span aria-hidden="true">▶</span> Preview voice
          </button>
        </div>
      </section>

      <section class="missions-section" aria-labelledby="missionsTitle">
        <div class="section-heading">
          <div><p class="section-kicker">CHOOSE YOUR CHALLENGE</p><h2 id="missionsTitle">Six Bee Missions</h2></div>
          <span class="tiny-pill">60 Level 1 words</span>
        </div>
        <div class="mission-grid">${missionCards}</div>
      </section>

      <section class="badges-panel" aria-labelledby="badgesTitle">
        <div><p class="section-kicker">YOUR COLLECTION</p><h2 id="badgesTitle">Bee Badges</h2></div>
        <div class="badge-list">${badges}</div>
        <button class="text-button" type="button" data-action="reset-progress">Reset progress</button>
      </section>

      <footer class="site-footer"><span>✨</span> <strong>CEVAZ Digital</strong> · Learn · Play · Grow <span>⭐</span></footer>
    </main>
  `;
}

export { MISSIONS };
