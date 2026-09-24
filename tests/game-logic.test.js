import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA_ROUND_SIZE,
  buildSoundTiles,
  buildWordMatchChoices,
  buildWordMask,
  wordRecognized,
  rewardForOutcome
} from '../js/controllers/GameController.js';
import { WORDS } from '../js/data/words.js';

test('sound detective tiles contain every target letter exactly once', () => {
  const tiles = buildSoundTiles('RABBIT', () => 0.37);
  assert.equal(tiles.length, 6);
  assert.equal(tiles.map(({ letter }) => letter).sort().join(''), [...'RABBIT'].sort().join(''));
  assert.equal(new Set(tiles.map(({ id }) => id)).size, 6);
});

test('word match choices contain target and remain unique', () => {
  const target = WORDS.find(({ word }) => word === 'rabbit');
  const choices = buildWordMatchChoices(target, WORDS, 4, () => 0.42);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices.map(({ word }) => word)).size, 4);
  assert.ok(choices.some(({ word }) => word === 'rabbit'));
});

test('word builder mask hides at least one but not every letter', () => {
  const result = buildWordMask('RABBIT', () => 0.25);
  assert.equal(result.mask.length, 6);
  assert.ok(result.hiddenIndices.length >= 1);
  assert.ok(result.hiddenIndices.length < 6);
  assert.ok(result.mask.includes('_'));
  assert.equal(result.mask.filter((value) => value !== '_').length + result.hiddenIndices.length, 6);
});

test('whole-word recognition matches expected lexical word only', () => {
  assert.equal(wordRecognized('rabbit', ['rabbit']), true);
  assert.equal(wordRecognized('rabbit', ['a rabbit please']), true);
  assert.equal(wordRecognized('rabbit', ['rapid']), false);
  assert.equal(wordRecognized('rabbit', []), false);
});

test('reward rules never subtract and give extra credit for comeback practice', () => {
  assert.deepEqual(rewardForOutcome({ exact: true, rescued: false }), { stars: 2, honeycomb: 1 });
  assert.deepEqual(rewardForOutcome({ exact: true, rescued: true }), { stars: 3, honeycomb: 2 });
  assert.deepEqual(rewardForOutcome({ exact: false, rescued: false }), { stars: 0, honeycomb: 0 });
});

test('Bee Arena uses a five-word practice round', () => {
  assert.equal(ARENA_ROUND_SIZE, 5);
});
