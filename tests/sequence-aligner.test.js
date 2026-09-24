import test from 'node:test';
import assert from 'node:assert/strict';
import { alignSpelling, chooseBestAlignment } from '../js/utils/sequence-aligner.js';

const types = (result) => result.operations.map(({ type }) => type);

test('aligns an exact spelling', () => {
  const result = alignSpelling('RABBIT', ['R', 'A', 'B', 'B', 'I', 'T']);
  assert.equal(result.status, 'exact');
  assert.equal(result.distance, 0);
  assert.deepEqual(types(result), ['match', 'match', 'match', 'match', 'match', 'match']);
  assert.deepEqual(result.rescueTargets, []);
});

test('identifies substitution without shifting repeated letters', () => {
  const result = alignSpelling('RABBIT', ['R', 'A', 'D', 'B', 'I', 'T']);
  assert.equal(result.distance, 1);
  const mismatch = result.operations.find(({ type }) => type === 'substitution');
  assert.deepEqual(
    { expected: mismatch.expected, heard: mismatch.heard, expectedIndex: mismatch.expectedIndex },
    { expected: 'B', heard: 'D', expectedIndex: 2 }
  );
  assert.equal(result.operations.at(-1).expected, 'T');
  assert.equal(result.operations.at(-1).type, 'match');
});

test('identifies a missing repeated letter as one deletion', () => {
  const result = alignSpelling('RABBIT', ['R', 'A', 'B', 'I', 'T']);
  const deletions = result.operations.filter(({ type }) => type === 'deletion');
  assert.equal(result.distance, 1);
  assert.equal(deletions.length, 1);
  assert.equal(deletions[0].expected, 'B');
  assert.equal(result.rescueTargets.length, 1);
  assert.equal(result.rescueTargets[0].expected, 'B');
});

test('identifies an extra repeated letter as one insertion', () => {
  const result = alignSpelling('RABBIT', ['R', 'A', 'B', 'B', 'B', 'I', 'T']);
  const insertions = result.operations.filter(({ type }) => type === 'insertion');
  assert.equal(result.distance, 1);
  assert.equal(insertions.length, 1);
  assert.equal(insertions[0].heard, 'B');
  assert.deepEqual(result.rescueTargets, []);
});

test('aligns a substitution in BEAUTIFUL', () => {
  const result = alignSpelling('BEAUTIFUL', [...'BEAUTIFAL']);
  const mismatch = result.operations.find(({ type }) => type === 'substitution');
  assert.equal(result.distance, 1);
  assert.equal(mismatch.expected, 'U');
  assert.equal(mismatch.heard, 'A');
});

test('chooses the speech alternative with the smallest edit distance', () => {
  const result = chooseBestAlignment('RABBIT', [
    [...'RABIT'],
    [...'RABBIT'],
    [...'RABBITT']
  ]);
  assert.equal(result.status, 'exact');
  assert.equal(result.heard.join(''), 'RABBIT');
});

test('returns retry when equally good alternatives imply different corrections', () => {
  const result = chooseBestAlignment('CAT', [[...'BAT'], [...'CAR']]);
  assert.equal(result.status, 'retry');
  assert.equal(result.reason, 'ambiguous-alternatives');
});

test('returns retry for empty or extremely distant evidence', () => {
  assert.equal(chooseBestAlignment('RABBIT', []).status, 'retry');
  assert.equal(chooseBestAlignment('RABBIT', [['X']]).status, 'retry');
});
