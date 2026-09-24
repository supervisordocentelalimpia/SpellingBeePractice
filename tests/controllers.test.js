import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeechController } from '../js/controllers/SpeechController.js';
import { SpellingController } from '../js/controllers/SpellingController.js';

class FakeUtterance {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.lang = '';
    this.rate = 1;
    this.pitch = 1;
    this.onend = null;
    this.onerror = null;
  }
}

class FakeRecognition {
  static last = null;
  constructor() {
    FakeRecognition.last = this;
    this.lang = '';
    this.continuous = true;
    this.interimResults = true;
    this.maxAlternatives = 1;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
  }
  start() { this.started = true; }
  abort() { this.aborted = true; }
}

function fakeSynthesis(voices = []) {
  return {
    spoken: [],
    getVoices() { return voices; },
    cancel() {},
    speak(utterance) {
      this.spoken.push(utterance);
      queueMicrotask(() => utterance.onend?.());
    }
  };
}

test('reports unsupported recognition cleanly', async () => {
  const speech = new SpeechController({ speechRecognitionCtor: null, speechSynthesis: fakeSynthesis(), UtteranceCtor: FakeUtterance });
  assert.equal(speech.canRecognize(), false);
  await assert.rejects(() => speech.listen('spelling'), /Speech recognition is not available/);
});

test('prioritizes en-US voices and natural-sounding names', () => {
  const voices = [
    { name: 'English UK', lang: 'en-GB', voiceURI: 'uk' },
    { name: 'Generic US', lang: 'en-US', voiceURI: 'generic' },
    { name: 'Microsoft Ava Natural', lang: 'en-US', voiceURI: 'ava' },
    { name: 'Samantha', lang: 'en-US', voiceURI: 'sam' }
  ];
  const speech = new SpeechController({ speechRecognitionCtor: FakeRecognition, speechSynthesis: fakeSynthesis(voices), UtteranceCtor: FakeUtterance });
  const result = speech.getVoices();
  assert.equal(result.length, 3);
  assert.equal(result[0].name, 'Microsoft Ava Natural');
  assert.ok(result.every(({ lang }) => lang.toLowerCase().startsWith('en-us')));
});

test('speak uses requested voice metadata and en-US locale', async () => {
  const voices = [{ name: 'Samantha', lang: 'en-US', voiceURI: 'sam' }];
  const synth = fakeSynthesis(voices);
  const speech = new SpeechController({ speechRecognitionCtor: FakeRecognition, speechSynthesis: synth, UtteranceCtor: FakeUtterance });
  await speech.speak('Rabbit', { voiceMetadata: voices[0], rate: 0.7 });
  assert.equal(synth.spoken[0].text, 'Rabbit');
  assert.equal(synth.spoken[0].voice.name, 'Samantha');
  assert.equal(synth.spoken[0].lang, 'en-US');
  assert.equal(synth.spoken[0].rate, 0.7);
});

test('listen configures short en-US recognition and returns alternatives', async () => {
  const speech = new SpeechController({ speechRecognitionCtor: FakeRecognition, speechSynthesis: fakeSynthesis(), UtteranceCtor: FakeUtterance });
  const pending = speech.listen('spelling');
  const recognition = FakeRecognition.last;
  assert.equal(recognition.lang, 'en-US');
  assert.equal(recognition.continuous, false);
  assert.equal(recognition.interimResults, false);
  assert.equal(recognition.maxAlternatives, 5);

  const result = [
    { transcript: 'are ay bee bee eye tea', confidence: 0.88 },
    { transcript: 'R A B B I T', confidence: 0.72 }
  ];
  result.isFinal = true;
  recognition.onresult({ results: [result] });

  const heard = await pending;
  assert.deepEqual(heard.transcripts, ['are ay bee bee eye tea', 'R A B B I T']);
  assert.equal(heard.confidence, 0.88);
});

test('spelling controller evaluates normalized alternatives', () => {
  const controller = new SpellingController();
  const result = controller.evaluateTranscripts('RABBIT', ['are ay dee bee eye tea', 'R A D B I T']);
  assert.equal(result.status, 'near-match');
  assert.equal(result.rescueTargets[0].expected, 'B');
  assert.equal(result.rescueTargets[0].heard, 'D');
});

test('isolated-letter evaluation recognizes the expected letter name', () => {
  const controller = new SpellingController();
  assert.equal(controller.evaluateLetter('B', ['bee']).rescued, true);
  assert.equal(controller.evaluateLetter('B', ['dee']).rescued, false);
});

test('spelling controller returns retry for transcripts with no letter evidence', () => {
  const controller = new SpellingController();
  const result = controller.evaluateTranscripts('RABBIT', ['rabbit', 'hello there']);
  assert.equal(result.status, 'retry');
});
