function voiceScore(voice) {
  const name = String(voice?.name ?? '').toLowerCase();
  let score = 0;
  if (name.includes('natural')) score += 80;
  if (name.includes('ava')) score += 70;
  if (name.includes('jenny')) score += 65;
  if (name.includes('aria')) score += 60;
  if (name.includes('samantha')) score += 55;
  if (name.includes('allison')) score += 50;
  if (name.includes('google us english')) score += 45;
  if (name.includes('microsoft')) score += 25;
  if (voice?.localService === false) score += 5;
  return score;
}

export class SpeechController {
  constructor(options = {}) {
    const globalObject = typeof window !== 'undefined' ? window : globalThis;
    this.RecognitionCtor = options.speechRecognitionCtor !== undefined
      ? options.speechRecognitionCtor
      : (globalObject.SpeechRecognition || globalObject.webkitSpeechRecognition || null);
    this.synthesis = options.speechSynthesis !== undefined
      ? options.speechSynthesis
      : (globalObject.speechSynthesis || null);
    this.UtteranceCtor = options.UtteranceCtor !== undefined
      ? options.UtteranceCtor
      : (globalObject.SpeechSynthesisUtterance || null);
    this.activeRecognition = null;
  }

  canRecognize() {
    return typeof this.RecognitionCtor === 'function';
  }

  canSpeak() {
    return Boolean(this.synthesis && this.UtteranceCtor && typeof this.synthesis.speak === 'function');
  }

  getVoices() {
    if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') return [];
    return [...(this.synthesis.getVoices() || [])]
      .filter((voice) => String(voice.lang ?? '').toLowerCase().startsWith('en-us'))
      .sort((a, b) => voiceScore(b) - voiceScore(a) || String(a.name).localeCompare(String(b.name)));
  }

  resolveVoice(metadata) {
    const voices = this.getVoices();
    if (!voices.length) return null;
    if (!metadata) return voices[0];
    return voices.find((voice) => voice.voiceURI && voice.voiceURI === metadata.voiceURI)
      || voices.find((voice) => voice.name === metadata.name && voice.lang === metadata.lang)
      || voices[0];
  }

  speak(text, { voiceMetadata = null, rate = 0.82, pitch = 1.02 } = {}) {
    if (!this.canSpeak()) return Promise.reject(new Error('Text to speech is not available in this browser.'));
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return Promise.resolve(false);

    this.synthesis.cancel?.();
    const utterance = new this.UtteranceCtor(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = Math.max(0.5, Math.min(1.4, Number(rate) || 0.82));
    utterance.pitch = Math.max(0.6, Math.min(1.4, Number(pitch) || 1.02));
    const voice = this.resolveVoice(voiceMetadata);
    if (voice) utterance.voice = voice;

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve(true);
      utterance.onerror = (event) => reject(new Error(event?.error || 'Speech playback failed.'));
      this.synthesis.speak(utterance);
    });
  }

  stopListening() {
    if (this.activeRecognition) {
      try { this.activeRecognition.abort?.(); } catch { /* no-op */ }
      this.activeRecognition = null;
    }
  }

  listen(mode = 'spelling') {
    if (!this.canRecognize()) {
      return Promise.reject(new Error('Speech recognition is not available in this browser.'));
    }

    this.stopListening();
    const recognition = new this.RecognitionCtor();
    this.activeRecognition = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        if (this.activeRecognition === recognition) this.activeRecognition = null;
        callback(value);
      };

      recognition.onresult = (event) => {
        const transcripts = [];
        let confidence = 0;
        for (const result of Array.from(event?.results || [])) {
          for (const alternative of Array.from(result || [])) {
            const transcript = String(alternative?.transcript ?? '').trim();
            if (transcript) transcripts.push(transcript);
            confidence = Math.max(confidence, Number(alternative?.confidence) || 0);
          }
        }
        finish(resolve, { mode, transcripts: [...new Set(transcripts)], confidence });
      };

      recognition.onerror = (event) => {
        const code = String(event?.error || 'recognition-error');
        finish(reject, new Error(`Speech recognition failed: ${code}`));
      };

      recognition.onend = () => {
        if (!settled) finish(resolve, { mode, transcripts: [], confidence: 0 });
      };

      try {
        recognition.start();
      } catch (error) {
        finish(reject, error instanceof Error ? error : new Error('Could not start speech recognition.'));
      }
    });
  }
}
