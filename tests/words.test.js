import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS } from '../js/data/words.js';

test('Level 1 bank contains exactly 60 unique lowercase words', () => {
  assert.equal(WORDS.length, 60);
  const spellings = WORDS.map(({ word }) => word);
  assert.equal(new Set(spellings).size, 60);
  assert.ok(spellings.every((word) => /^[a-z]+$/.test(word)));
});

test('every word has non-empty emoji metadata', () => {
  assert.ok(WORDS.every(({ emoji }) => typeof emoji === 'string' && emoji.trim().length > 0));
});
