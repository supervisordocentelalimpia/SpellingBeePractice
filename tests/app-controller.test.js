import test from 'node:test';
import assert from 'node:assert/strict';
import { AppController } from '../js/controllers/AppController.js';

class FakeRoot {
  constructor() { this.innerHTML = ''; this.listeners = new Map(); }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
}

function dependencies(root) {
  const rewardState = { stars: 2, honeycomb: 1, badges: [], stats: { practiced: 1, exact: 1, rescuedLetters: 0, completedMissions: [] } };
  return {
    root,
    wordModel: { all: () => [], pick: () => [] },
    sessionModel: {},
    rewardModel: { snapshot: () => rewardState, reset: () => rewardState },
    settingsModel: { getVoice: () => null, setVoice: () => null },
    speechController: {
      getVoices: () => [{ name: 'Ava Natural', lang: 'en-US', voiceURI: 'ava' }],
      canRecognize: () => true,
      canSpeak: () => true,
      synthesis: null,
      speak: async () => true,
      stopListening: () => {}
    },
    spellingController: {},
    confirmReset: () => true
  };
}

test('app controller initializes home and event delegation', () => {
  const root = new FakeRoot();
  const app = new AppController(dependencies(root));
  app.init();
  assert.match(root.innerHTML, /Spelling Bee/);
  assert.match(root.innerHTML, /Ava Natural/);
  assert.ok(root.listeners.has('click'));
  assert.ok(root.listeners.has('change'));
});
