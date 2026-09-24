import { shuffle, sample } from '../utils/random.js';
import { renderGameShell } from '../views/GameView.js';
import { renderSpellingAttempt } from '../views/SpellingView.js';
import { renderLetterRescue } from '../views/LetterRescueView.js';
import { celebrate } from '../utils/celebration.js';

export const ARENA_ROUND_SIZE = 5;

const MISSION_META = {
  sound: { title: 'Sound Detective', icon: '👂', subtitle: 'Listen closely and build the word.', count: 8 },
  spell: { title: 'Spell It Out!', icon: '🎤', subtitle: 'Hear the word, then spell it aloud.', count: 8 },
  voice: { title: 'Voice Challenge', icon: '🗣️', subtitle: 'Listen and say the whole word.', count: 8 },
  match: { title: 'Word Match', icon: '🧠', subtitle: 'Match the picture to the right word.', count: 8 },
  builder: { title: 'Word Builder', icon: '✏️', subtitle: 'Find the missing letters.', count: 8 },
  arena: { title: 'Bee Arena', icon: '🏆', subtitle: 'Practice a real Spelling Bee round.', count: ARENA_ROUND_SIZE }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildSoundTiles(word, random = Math.random) {
  const tiles = [...String(word ?? '').toUpperCase()].map((letter, index) => ({ id: `${index}-${letter}`, letter }));
  return shuffle(tiles, random);
}

export function buildWordMatchChoices(target, allWords, count = 4, random = Math.random) {
  if (!target) return [];
  const others = allWords.filter(({ word }) => word !== target.word);
  return shuffle([target, ...sample(others, Math.max(0, count - 1), random)], random).slice(0, count);
}

export function buildWordMask(word, random = Math.random) {
  const letters = [...String(word ?? '').toUpperCase()];
  if (letters.length <= 1) return { mask: letters, hiddenIndices: [] };
  const hideCount = Math.max(1, Math.min(letters.length - 1, Math.round(letters.length * 0.34)));
  const indices = shuffle(letters.map((_, index) => index), random).slice(0, hideCount).sort((a, b) => a - b);
  const hidden = new Set(indices);
  return {
    mask: letters.map((letter, index) => hidden.has(index) ? '_' : letter),
    hiddenIndices: indices
  };
}

export function wordRecognized(expectedWord, transcripts = []) {
  const expected = String(expectedWord ?? '').toLowerCase();
  if (!expected) return false;
  return transcripts.some((transcript) => {
    const tokens = String(transcript ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    return tokens.includes(expected);
  });
}

export function rewardForOutcome({ exact = false, rescued = false } = {}) {
  if (!exact) return { stars: 0, honeycomb: 0 };
  return rescued ? { stars: 3, honeycomb: 2 } : { stars: 2, honeycomb: 1 };
}

export class GameController {
  constructor({ root, wordModel, sessionModel, rewardModel, settingsModel, speechController, spellingController, onHome }) {
    this.root = root;
    this.wordModel = wordModel;
    this.session = sessionModel;
    this.rewards = rewardModel;
    this.settings = settingsModel;
    this.speech = speechController;
    this.spelling = spellingController;
    this.onHome = onHome;
    this.missionId = null;
    this.deck = [];
    this.index = 0;
    this.finished = false;
    this.state = {};
  }

  start(missionId) {
    if (!MISSION_META[missionId]) return;
    this.missionId = missionId;
    this.session.startMission(missionId);
    const count = MISSION_META[missionId].count;
    this.deck = this.wordModel.pick(count);
    this.index = 0;
    this.finished = false;
    this.prepareCurrentWord();
    this.render();
  }

  currentWord() {
    return this.deck[this.index] ?? null;
  }

  prepareCurrentWord() {
    const word = this.currentWord();
    this.session.setWord(word);
    this.state = {
      phase: 'prompt',
      feedback: '',
      feedbackTone: 'practice',
      solved: false,
      heardLetters: [],
      alignment: null,
      rescueTarget: null,
      rescueSuccess: false,
      rescuedThisWord: false,
      wrongChoices: new Set(),
      built: [],
      tiles: word ? buildSoundTiles(word.word) : [],
      choices: word ? buildWordMatchChoices(word, this.wordModel.all()) : [],
      mask: word ? buildWordMask(word.word) : { mask: [], hiddenIndices: [] }
    };
  }

  render() {
    if (this.finished) {
      this.renderFinished();
      return;
    }
    const meta = MISSION_META[this.missionId];
    const body = this.renderMissionBody();
    this.root.innerHTML = renderGameShell({
      title: meta.title,
      icon: meta.icon,
      subtitle: meta.subtitle,
      item: this.index + 1,
      total: this.deck.length,
      streak: this.session.snapshot().streak,
      body
    });
  }

  renderMissionBody() {
    switch (this.missionId) {
      case 'sound': return this.renderSoundDetective();
      case 'spell': return this.renderSpokenSpelling(false);
      case 'voice': return this.renderVoiceChallenge();
      case 'match': return this.renderWordMatch();
      case 'builder': return this.renderWordBuilder();
      case 'arena': return this.renderSpokenSpelling(true);
      default: return '<div class="challenge-center"><h2>Choose a mission.</h2></div>';
    }
  }

  feedbackMarkup() {
    if (!this.state.feedback) return '';
    const title = this.state.feedbackTone === 'excellent' ? 'Excellent!'
      : this.state.feedbackTone === 'great' ? 'Great!'
      : 'Keep practicing!';
    return `<div class="feedback-card ${this.state.feedbackTone}"><strong>${title}</strong>${escapeHtml(this.state.feedback)}</div>`;
  }

  renderSoundDetective() {
    const word = this.currentWord();
    const targetLength = word.word.length;
    const slots = Array.from({ length: targetLength }, (_, index) => {
      const value = this.state.built[index]?.letter || '';
      return `<span class="word-slot${value ? ' filled' : ''}">${value || '•'}</span>`;
    }).join('');
    const used = new Set(this.state.built.map(({ id }) => id));
    const tiles = this.state.tiles.map((tile) => `
      <button class="tile-button${used.has(tile.id) ? ' used' : ''}" type="button" data-action="pick-tile" data-tile-id="${tile.id}" aria-label="Choose letter ${tile.letter}">${tile.letter}</button>
    `).join('');
    return `
      <div class="challenge-center">
        <span class="prompt-emoji" aria-hidden="true">${word.emoji}</span>
        <p class="section-kicker">SOUND DETECTIVE</p>
        <h2>Listen. Then build the word.</h2>
        <p class="lead">Tap the letters in the order you hear them.</p>
        <div class="action-row"><button class="btn btn-secondary big-action" type="button" data-action="hear-word">🔊 Hear word</button></div>
        <div class="word-slots" aria-label="Your spelling">${slots}</div>
        <div class="tile-bank" aria-label="Letter choices">${tiles}</div>
        <div class="action-row">
          <button class="btn btn-secondary" type="button" data-action="clear-tiles"${this.state.built.length ? '' : ' disabled'}>↻ Clear</button>
          ${this.state.solved ? '<button class="btn btn-primary" type="button" data-action="next">Next word →</button>' : ''}
        </div>
        ${this.feedbackMarkup()}
      </div>
    `;
  }

  renderSpokenSpelling(arena = false) {
    const word = this.currentWord();
    if (this.state.phase === 'rescue') {
      const target = this.state.rescueTarget?.expected || '';
      return `${renderLetterRescue({ word: word.word, targetLetter: target, canRecognize: this.speech.canRecognize() })}${this.feedbackMarkup()}`;
    }
    if (this.state.phase === 'rescue-success') {
      const target = this.state.rescueTarget?.expected || '';
      return `
        <div class="rescue-card rescue-success-card">
          <div class="rescue-badge">⭐ LETTER RESCUED</div>
          <div class="rescued-letter" aria-hidden="true">${escapeHtml(target)}</div>
          <h2>${escapeHtml(target)} rescued!</h2>
          <p class="rescue-instruction">Nice work. Put the letter back into the whole word.</p>
          <button class="btn btn-primary big-action" type="button" data-action="retry-whole">🎤 Spell the whole word again</button>
        </div>
      `;
    }
    if (this.state.phase === 'review') {
      const evaluation = this.state.alignment;
      const hasTarget = Boolean(this.state.rescueTarget?.expected);
      const label = evaluation?.distance === 1 ? 'Great!' : 'Keep practicing!';
      const tone = evaluation?.distance === 1 ? 'great' : 'practice';
      const correction = hasTarget
        ? `One letter needs a little practice. Let's rescue ${this.state.rescueTarget.expected}.`
        : 'An extra letter sneaked in. Listen again and try the whole spelling once more.';
      return `
        ${renderSpellingAttempt({ word: word.word, emoji: word.emoji, heardLetters: this.state.heardLetters, alignment: evaluation })}
        <div class="feedback-card ${tone}"><strong>${label}</strong>${escapeHtml(correction)}</div>
        <div class="action-row">
          ${hasTarget
            ? `<button class="btn btn-warm big-action" type="button" data-action="start-rescue">🐝 Rescue ${escapeHtml(this.state.rescueTarget.expected)}</button>`
            : '<button class="btn btn-primary big-action" type="button" data-action="retry-whole">🎤 Try the whole word again</button>'}
        </div>
      `;
    }
    if (this.state.phase === 'solved') {
      return `
        ${renderSpellingAttempt({ word: word.word, emoji: word.emoji, heardLetters: this.state.heardLetters, alignment: this.state.alignment })}
        <div class="feedback-card excellent"><strong>Excellent!</strong>${this.state.rescuedThisWord ? 'You brought the rescued letter back into the word!' : 'Every letter matched!'}</div>
        <div class="action-row"><button class="btn btn-primary big-action" type="button" data-action="next">Next word →</button></div>
      `;
    }

    return `
      <div class="challenge-center ${arena ? 'arena-stage' : ''}">
        <span class="prompt-emoji" aria-hidden="true">${arena ? '🏆' : '🐝'}</span>
        <p class="section-kicker">${arena ? 'BEE ARENA' : 'SPELL IT OUT'}</p>
        <h2>${arena ? 'Your word is ready.' : 'Listen. Then spell it aloud.'}</h2>
        <p class="lead">Say each letter clearly. You can also say <strong>double B</strong> for repeated letters.</p>
        <div class="action-row">
          <button class="btn btn-secondary big-action" type="button" data-action="hear-word">🔊 ${arena ? 'Hear my word' : 'Hear word'}</button>
          ${arena ? '<button class="btn btn-secondary big-action" type="button" data-action="repeat-please">🔁 Repeat please</button>' : ''}
          <button class="btn btn-primary big-action mic-button" type="button" data-action="spell-word"${this.speech.canRecognize() ? '' : ' disabled'}>🎤 Spell aloud</button>
        </div>
        ${arena ? '<div class="arena-language"><span>💬 “Repeat please.”</span><span>💬 “Excuse me.”</span></div>' : ''}
        ${this.speech.canRecognize() ? '' : '<div class="feedback-card practice"><strong>Keep practicing!</strong>Your browser does not offer speech recognition here. Try current Chrome or Edge for microphone missions.</div>'}
        ${this.feedbackMarkup()}
      </div>
    `;
  }

  renderVoiceChallenge() {
    const word = this.currentWord();
    return `
      <div class="challenge-center">
        <span class="prompt-emoji" aria-hidden="true">${word.emoji}</span>
        <p class="section-kicker">VOICE CHALLENGE</p>
        <h2 class="word-display">${escapeHtml(word.word.toUpperCase())}</h2>
        <p class="lead">Listen to the word, then say the whole word clearly.</p>
        <div class="action-row">
          <button class="btn btn-secondary big-action" type="button" data-action="hear-word">🔊 Listen</button>
          <button class="btn btn-primary big-action mic-button" type="button" data-action="say-word"${this.speech.canRecognize() ? '' : ' disabled'}>🎤 Say the word</button>
        </div>
        ${this.state.solved ? '<div class="action-row"><button class="btn btn-primary" type="button" data-action="next">Next word →</button></div>' : ''}
        ${this.speech.canRecognize() ? '' : '<div class="feedback-card practice"><strong>Keep practicing!</strong>Microphone recognition is not available in this browser.</div>'}
        ${this.feedbackMarkup()}
      </div>
    `;
  }

  renderWordMatch() {
    const word = this.currentWord();
    const choices = this.state.choices.map((choice) => {
      const wrong = this.state.wrongChoices.has(choice.word);
      return `<button class="choice-card${wrong ? ' practice' : ''}" type="button" data-action="choose-match" data-word="${escapeHtml(choice.word)}"${this.state.solved ? ' disabled' : ''}>${escapeHtml(choice.word.toUpperCase())}</button>`;
    }).join('');
    return `
      <div class="challenge-center">
        <span class="prompt-emoji" aria-hidden="true">${word.emoji}</span>
        <p class="section-kicker">WORD MATCH</p>
        <h2>Which word matches the picture?</h2>
        <p class="lead">Choose carefully. You can listen if you need a clue.</p>
        <div class="action-row"><button class="btn btn-secondary" type="button" data-action="hear-word">🔊 Hear the word</button></div>
        <div class="choice-grid">${choices}</div>
        ${this.state.solved ? '<div class="action-row"><button class="btn btn-primary" type="button" data-action="next">Next word →</button></div>' : ''}
        ${this.feedbackMarkup()}
      </div>
    `;
  }

  renderWordBuilder() {
    const word = this.currentWord();
    const masked = this.state.mask.mask.join(' ');
    return `
      <div class="challenge-center">
        <span class="prompt-emoji" aria-hidden="true">${word.emoji}</span>
        <p class="section-kicker">WORD BUILDER</p>
        <h2>Repair the word!</h2>
        <p class="masked-word" aria-label="Word with missing letters">${escapeHtml(masked)}</p>
        <p class="lead">Type the complete word to fill every missing letter.</p>
        <div class="action-row"><button class="btn btn-secondary" type="button" data-action="hear-word">🔊 Hear word</button></div>
        <input class="builder-input" data-role="builder-input" type="text" autocomplete="off" autocapitalize="characters" maxlength="24" aria-label="Type the complete word"${this.state.solved ? ' disabled' : ''}>
        <div class="action-row">
          <button class="btn btn-primary" type="button" data-action="check-builder"${this.state.solved ? ' disabled' : ''}>Check my word</button>
          ${this.state.solved ? '<button class="btn btn-primary" type="button" data-action="next">Next word →</button>' : ''}
        </div>
        ${this.feedbackMarkup()}
      </div>
    `;
  }

  renderFinished() {
    const meta = MISSION_META[this.missionId];
    const rewardState = this.rewards.snapshot();
    this.root.innerHTML = renderGameShell({
      title: meta.title,
      icon: meta.icon,
      subtitle: 'Mission complete!',
      item: this.deck.length,
      total: this.deck.length,
      streak: this.session.snapshot().streak,
      body: `
        <div class="challenge-center mission-complete">
          <span class="prompt-emoji" aria-hidden="true">🏅</span>
          <p class="section-kicker">MISSION COMPLETE</p>
          <h2>You did it, Super Bee!</h2>
          <p class="lead">You finished ${escapeHtml(meta.title)}. Your practice is saved on this device.</p>
          <div class="completion-reward"><span>⭐</span><strong>${rewardState.stars}</strong><small>Total Bee Stars</small></div>
          <div class="action-row">
            <button class="btn btn-secondary" type="button" data-action="restart-mission">↻ Play again</button>
            <button class="btn btn-primary" type="button" data-action="home">Choose another mission →</button>
          </div>
        </div>
      `
    });
    celebrate(this.root.querySelector('.game-stage'), 'bees', 16);
  }

  async handleAction(action, element) {
    if (action === 'home') { this.speech.stopListening(); this.onHome?.(); return; }
    if (action === 'restart-mission') { this.start(this.missionId); return; }
    if (this.finished) return;

    switch (action) {
      case 'hear-word': await this.safeSpeak(this.currentWord()?.word, 0.76); break;
      case 'repeat-please': await this.safeSpeak(this.currentWord()?.word, 0.72); break;
      case 'pick-tile': this.pickTile(element?.dataset?.tileId); break;
      case 'clear-tiles': this.clearTiles(); break;
      case 'spell-word': await this.listenForSpelling(); break;
      case 'start-rescue': this.state.phase = 'rescue'; this.render(); break;
      case 'listen-letter': await this.safeSpeak(this.state.rescueTarget?.expected, 0.7); break;
      case 'repeat-letter': await this.listenForRescue(); break;
      case 'retry-whole': this.state.phase = 'prompt'; this.state.feedback = ''; this.render(); break;
      case 'say-word': await this.listenForWholeWord(); break;
      case 'choose-match': this.chooseMatch(element?.dataset?.word); break;
      case 'check-builder': this.checkBuilder(); break;
      case 'next': this.advance(); break;
      default: break;
    }
  }

  async safeSpeak(text, rate = 0.78) {
    if (!text) return;
    try {
      await this.speech.speak(text, { voiceMetadata: this.settings.getVoice(), rate });
    } catch {
      this.state.feedbackTone = 'practice';
      this.state.feedback = 'Audio is not available right now. You can keep practicing visually.';
      this.render();
    }
  }

  pickTile(tileId) {
    if (this.state.solved || !tileId || this.state.built.some((tile) => tile.id === tileId)) return;
    const tile = this.state.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    this.state.built.push(tile);
    if (this.state.built.length === this.currentWord().word.length) {
      const builtWord = this.state.built.map(({ letter }) => letter).join('');
      if (builtWord === this.currentWord().word.toUpperCase()) {
        this.state.solved = true;
        this.state.feedbackTone = 'excellent';
        this.state.feedback = 'Word built! Every letter is in the right place.';
        this.awardSolvedWord();
      } else {
        this.session.markMiss();
        this.state.feedbackTone = 'practice';
        this.state.feedback = 'Those are the right letters. Try a different order!';
      }
    }
    this.render();
    if (this.state.solved) celebrate(this.root.querySelector('.game-stage'), 'stars', 10);
  }

  clearTiles() {
    if (this.state.solved) return;
    this.state.built = [];
    this.state.feedback = '';
    this.render();
  }

  async listenForSpelling() {
    const button = this.root.querySelector('[data-action="spell-word"]');
    if (button) { button.disabled = true; button.classList.add('listening'); button.textContent = '🎤 Listening…'; }
    try {
      const heard = await this.speech.listen('spelling');
      this.session.recordAttempt();
      const evaluation = this.spelling.evaluateTranscripts(this.currentWord().word, heard.transcripts);
      this.state.alignment = evaluation;
      this.state.heardLetters = evaluation.heard || [];
      if (evaluation.status === 'exact') {
        this.state.phase = 'solved';
        this.state.solved = true;
        this.awardSolvedWord();
        this.render();
        celebrate(this.root.querySelector('.game-stage'), 'stars', 12);
        return;
      }
      if (evaluation.status === 'retry') {
        this.session.markMiss();
        this.state.feedbackTone = 'practice';
        this.state.feedback = "I couldn't hear enough clear letters. Listen once more and try again!";
        this.state.phase = 'prompt';
        this.render();
        return;
      }
      this.session.markMiss();
      this.state.rescueTarget = evaluation.rescueTargets?.[0] || null;
      this.state.phase = 'review';
      this.render();
    } catch (error) {
      this.state.feedbackTone = 'practice';
      this.state.feedback = this.friendlySpeechError(error);
      this.state.phase = 'prompt';
      this.render();
    }
  }

  async listenForRescue() {
    const target = this.state.rescueTarget?.expected;
    if (!target) return;
    const button = this.root.querySelector('[data-action="repeat-letter"]');
    if (button) { button.disabled = true; button.classList.add('listening'); button.textContent = `🎤 Say ${target}…`; }
    try {
      const heard = await this.speech.listen('letter');
      const result = this.spelling.evaluateLetter(target, heard.transcripts);
      if (result.rescued) {
        this.state.rescueSuccess = true;
        this.state.rescuedThisWord = true;
        this.session.recordRescue();
        this.rewards.addStars(1);
        this.rewards.fillHoneycomb(1);
        this.state.phase = 'rescue-success';
        this.render();
        celebrate(this.root.querySelector('.game-stage'), 'bees', 10);
      } else {
        this.state.feedbackTone = 'practice';
        this.state.feedback = `Almost! Tap ${target} to listen, then try the same letter again.`;
        this.state.phase = 'rescue';
        this.render();
      }
    } catch (error) {
      this.state.feedbackTone = 'practice';
      this.state.feedback = this.friendlySpeechError(error);
      this.state.phase = 'rescue';
      this.render();
    }
  }

  async listenForWholeWord() {
    if (this.state.solved) return;
    const button = this.root.querySelector('[data-action="say-word"]');
    if (button) { button.disabled = true; button.classList.add('listening'); button.textContent = '🎤 Listening…'; }
    try {
      const heard = await this.speech.listen('word');
      this.session.recordAttempt();
      if (wordRecognized(this.currentWord().word, heard.transcripts)) {
        this.state.solved = true;
        this.state.feedbackTone = 'excellent';
        this.state.feedback = 'The browser recognized the word. Nice clear practice!';
        this.awardSolvedWord();
        this.render();
        celebrate(this.root.querySelector('.game-stage'), 'stars', 10);
      } else {
        this.session.markMiss();
        this.state.feedbackTone = 'practice';
        this.state.feedback = heard.transcripts.length
          ? 'Listen once more and try the whole word again.'
          : "I couldn't hear that clearly. Let's try again!";
        this.render();
      }
    } catch (error) {
      this.state.feedbackTone = 'practice';
      this.state.feedback = this.friendlySpeechError(error);
      this.render();
    }
  }

  chooseMatch(chosenWord) {
    if (this.state.solved || !chosenWord) return;
    if (chosenWord === this.currentWord().word) {
      this.state.solved = true;
      this.state.feedbackTone = 'excellent';
      this.state.feedback = 'You matched the picture and the word!';
      this.awardSolvedWord();
      this.render();
      celebrate(this.root.querySelector('.game-stage'), 'stars', 9);
    } else {
      this.session.markMiss();
      this.state.wrongChoices.add(chosenWord);
      this.state.feedbackTone = 'great';
      this.state.feedback = 'Great try! Look at the picture and choose again.';
      this.render();
    }
  }

  checkBuilder() {
    if (this.state.solved) return;
    const input = this.root.querySelector('[data-role="builder-input"]');
    const answer = String(input?.value ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    if (answer === this.currentWord().word.toUpperCase()) {
      this.state.solved = true;
      this.state.feedbackTone = 'excellent';
      this.state.feedback = 'Word restored! Every missing letter is back.';
      this.awardSolvedWord();
      this.render();
      celebrate(this.root.querySelector('.game-stage'), 'stars', 9);
    } else {
      this.session.markMiss();
      this.state.feedbackTone = answer ? 'practice' : 'great';
      this.state.feedback = answer ? 'Check the missing letters and try again.' : 'Type the whole word when you are ready.';
      this.render();
    }
  }

  awardSolvedWord() {
    this.session.markExact();
    const rescuedCount = this.session.snapshot().rescuedThisWord;
    const reward = rewardForOutcome({ exact: true, rescued: rescuedCount > 0 });
    this.rewards.addStars(reward.stars);
    this.rewards.fillHoneycomb(reward.honeycomb);
    const missionComplete = this.index === this.deck.length - 1;
    this.rewards.recordPractice({
      exact: true,
      rescuedLetters: rescuedCount,
      missionId: this.missionId,
      missionComplete
    });
    if (this.missionId === 'spell' || this.missionId === 'arena') this.rewards.unlockBadge('Brave Speller');
    if (rescuedCount > 0) this.rewards.unlockBadge('Comeback Bee');
    if (this.rewards.snapshot().stats.exact >= 5) this.rewards.unlockBadge('Spelling Star');
    if (missionComplete) {
      if (this.missionId === 'sound') this.rewards.unlockBadge('Super Listener');
      if (this.missionId === 'arena') this.rewards.unlockBadge('Bee Arena Ready');
    }
  }

  advance() {
    if (!this.state.solved) return;
    this.index += 1;
    if (this.index >= this.deck.length) {
      this.finished = true;
      this.render();
      return;
    }
    this.prepareCurrentWord();
    this.render();
  }

  friendlySpeechError(error) {
    const message = String(error?.message ?? '').toLowerCase();
    if (message.includes('not-allowed') || message.includes('permission')) {
      return 'Please allow microphone access, then try again.';
    }
    if (message.includes('not available')) {
      return 'Microphone spelling is not available in this browser. Try current Chrome or Edge.';
    }
    return "I couldn't hear that clearly. Let's try again!";
  }
}
