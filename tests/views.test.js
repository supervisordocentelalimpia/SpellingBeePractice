import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHome } from '../js/views/HomeView.js';
import { renderGameShell } from '../js/views/GameView.js';
import { renderSpellingAttempt } from '../js/views/SpellingView.js';
import { renderLetterRescue } from '../js/views/LetterRescueView.js';
import { createCelebrationMarkup } from '../js/utils/celebration.js';

test('home renders all six mission titles and voice controls', () => {
  const html = renderHome({
    voices: [{ name: 'Ava Natural', lang: 'en-US', voiceURI: 'ava' }],
    selectedVoice: { name: 'Ava Natural', lang: 'en-US', voiceURI: 'ava' },
    rewards: { stars: 4, honeycomb: 3, badges: ['Super Listener'], stats: { practiced: 2 } },
    speechRecognitionAvailable: true,
    speechSynthesisAvailable: true
  });
  for (const title of ['Sound Detective', 'Spell It Out!', 'Voice Challenge', 'Word Match', 'Word Builder', 'Bee Arena']) {
    assert.match(html, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /id="voiceSelect"/);
  assert.match(html, /data-action="preview-voice"/);
  assert.match(html, /aria-label="Start Spell It Out!/);
  assert.doesNotMatch(html, /pronunciation score|\d+\s*\/\s*100/i);
});

test('game shell includes home navigation, progress and live feedback region', () => {
  const html = renderGameShell({ title: 'Spell It Out!', icon: '🎤', subtitle: 'Listen and spell', item: 2, total: 8, streak: 3, body: '<p>Body</p>' });
  assert.match(html, /data-action="home"/);
  assert.match(html, /Item 2 of 8/);
  assert.match(html, /Streak 3/);
  assert.match(html, /aria-live="polite"/);
});

test('spelling attempt renders heard letters and highlights the expected rescue letter', () => {
  const alignment = {
    operations: [
      { type: 'match', expected: 'R', heard: 'R', expectedIndex: 0 },
      { type: 'match', expected: 'A', heard: 'A', expectedIndex: 1 },
      { type: 'substitution', expected: 'B', heard: 'D', expectedIndex: 2 },
      { type: 'match', expected: 'B', heard: 'B', expectedIndex: 3 }
    ]
  };
  const html = renderSpellingAttempt({ word: 'RABBIT', emoji: '🐰', heardLetters: ['R', 'A', 'D', 'B'], alignment });
  assert.match(html, /I heard/);
  assert.match(html, />D</);
  assert.match(html, /letter-tile needs-rescue/);
  assert.match(html, />B</);
});

test('letter rescue tells the child to tap the expected letter and repeat it', () => {
  const html = renderLetterRescue({ word: 'RABBIT', targetLetter: 'B', canRecognize: true });
  assert.match(html, /LETTER RESCUE/);
  assert.match(html, /Tap B to listen/);
  assert.match(html, /data-action="listen-letter"/);
  assert.match(html, /data-action="repeat-letter"/);
  assert.doesNotMatch(html, /IPA|phoneme|wrong|failed/i);
});

test('celebration markup is bounded and child-friendly', () => {
  const html = createCelebrationMarkup('stars', 6);
  assert.equal((html.match(/celebration-particle/g) || []).length, 6);
  assert.match(html, /⭐|✨/);
});
