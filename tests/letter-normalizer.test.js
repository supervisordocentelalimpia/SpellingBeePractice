import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTranscript, normalizeAlternatives } from '../js/utils/letter-normalizer.js';

const letters = (text) => normalizeTranscript(text).join('');

test('normalizes direct letter tokens with punctuation', () => {
  assert.equal(letters('R, A, B, B, I, T.'), 'RABBIT');
});

test('normalizes common spoken letter names', () => {
  assert.equal(letters('are ay bee bee eye tea'), 'RABBIT');
  assert.equal(letters('see ay tea'), 'CAT');
  assert.equal(letters('why oh you'), 'YOU');
});

test('expands double plus a normal letter name', () => {
  assert.equal(letters('are ay double bee eye tea'), 'RABBIT');
  assert.equal(letters('double zee'), 'ZZ');
});

test('treats double u / double you as the letter W', () => {
  assert.equal(letters('double you'), 'W');
  assert.equal(letters('double u'), 'W');
});

test('ignores safe filler words around spelling', () => {
  assert.equal(letters('um letter bee please'), 'B');
  assert.equal(letters('okay are ay bee bee eye tea'), 'RABBIT');
});

test('does not turn an ordinary whole word into a spelling sequence', () => {
  assert.deepEqual(normalizeTranscript('rabbit'), []);
  assert.deepEqual(normalizeTranscript('beautiful'), []);
});

test('returns no letters for noise or empty input', () => {
  assert.deepEqual(normalizeTranscript('hello there'), []);
  assert.deepEqual(normalizeTranscript(''), []);
  assert.deepEqual(normalizeTranscript(null), []);
});

test('normalizes alternatives and removes duplicate sequences', () => {
  const result = normalizeAlternatives([
    'are ay bee bee eye tea',
    'R A B B I T',
    'rabbit',
    'are ay bee bee eye tea'
  ]);
  assert.deepEqual(result, [['R', 'A', 'B', 'B', 'I', 'T']]);
});
