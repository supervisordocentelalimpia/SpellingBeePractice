import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, DEFAULT_STATE, STORAGE_KEY } from '../js/utils/storage.js';
import { WordModel } from '../js/models/WordModel.js';
import { SessionModel } from '../js/models/SessionModel.js';
import { SettingsModel } from '../js/models/SettingsModel.js';
import { RewardModel } from '../js/models/RewardModel.js';

function memoryAdapter(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('storage starts with safe defaults', () => {
  const storage = createStorage(memoryAdapter());
  assert.deepEqual(storage.load(), DEFAULT_STATE);
});

test('storage falls back safely from corrupt JSON', () => {
  const storage = createStorage(memoryAdapter({ [STORAGE_KEY]: '{bad json' }));
  assert.deepEqual(storage.load(), DEFAULT_STATE);
});

test('settings persist and clear a selected voice', () => {
  const storage = createStorage(memoryAdapter());
  const settings = new SettingsModel(storage);
  settings.setVoice({ name: 'Ava', lang: 'en-US', voiceURI: 'ava' });
  assert.equal(settings.getVoice().name, 'Ava');
  settings.setVoice(null);
  assert.equal(settings.getVoice(), null);
});

test('reward stars never decrease and badges stay unique', () => {
  const storage = createStorage(memoryAdapter());
  const rewards = new RewardModel(storage);
  rewards.addStars(3);
  rewards.addStars(-10);
  rewards.unlockBadge('Brave Speller');
  rewards.unlockBadge('Brave Speller');
  const state = rewards.snapshot();
  assert.equal(state.stars, 3);
  assert.deepEqual(state.badges, ['Brave Speller']);
});

test('honeycomb is clamped to twelve cells', () => {
  const storage = createStorage(memoryAdapter());
  const rewards = new RewardModel(storage);
  rewards.fillHoneycomb(30);
  assert.equal(rewards.snapshot().honeycomb, 12);
});

test('reward practice stats and reset persist correctly', () => {
  const adapter = memoryAdapter();
  const storage = createStorage(adapter);
  const rewards = new RewardModel(storage);
  rewards.recordPractice({ exact: true, rescuedLetters: 2, missionId: 'spell', missionComplete: true });
  const state = rewards.snapshot();
  assert.equal(state.stats.practiced, 1);
  assert.equal(state.stats.exact, 1);
  assert.equal(state.stats.rescuedLetters, 2);
  assert.deepEqual(state.stats.completedMissions, ['spell']);
  rewards.reset();
  assert.deepEqual(storage.load(), DEFAULT_STATE);
});

test('word model exposes exactly the official bank and can look up words', () => {
  const model = new WordModel();
  assert.equal(model.count(), 60);
  assert.equal(model.getByWord('rabbit').emoji, '🐰');
  assert.equal(model.getByWord('not-a-word'), null);
});

test('session model tracks mission, word, and success streak', () => {
  const session = new SessionModel();
  session.startMission('spell');
  session.setWord({ word: 'rabbit', emoji: '🐰' });
  session.markExact();
  session.markExact();
  assert.equal(session.snapshot().streak, 2);
  session.markMiss();
  assert.equal(session.snapshot().streak, 0);
  assert.equal(session.snapshot().missionId, 'spell');
  assert.equal(session.snapshot().currentWord.word, 'rabbit');
});

test('settings and rewards do not overwrite each other in shared storage', () => {
  const storage = createStorage(memoryAdapter());
  const settings = new SettingsModel(storage);
  const rewards = new RewardModel(storage);
  rewards.addStars(5);
  settings.setVoice({ name: 'Ava', lang: 'en-US', voiceURI: 'ava' });
  assert.equal(storage.load().stars, 5);
  rewards.fillHoneycomb(2);
  assert.equal(storage.load().selectedVoice.name, 'Ava');
});
