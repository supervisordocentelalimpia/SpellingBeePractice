import { renderHome } from '../views/HomeView.js';
import { GameController } from './GameController.js';

function voiceMetadata(voice) {
  return voice ? { name: String(voice.name || ''), lang: String(voice.lang || ''), voiceURI: String(voice.voiceURI || '') } : null;
}

function voiceKey(voice) {
  return String(voice?.voiceURI || voice?.name || '');
}

export class AppController {
  constructor({
    root,
    wordModel,
    sessionModel,
    rewardModel,
    settingsModel,
    speechController,
    spellingController,
    confirmReset
  }) {
    this.root = root;
    this.wordModel = wordModel;
    this.session = sessionModel;
    this.rewards = rewardModel;
    this.settings = settingsModel;
    this.speech = speechController;
    this.spelling = spellingController;
    this.confirmReset = confirmReset || (() => globalThis.confirm?.('Reset all Bee Stars, badges, and progress on this device?') ?? false);
    this.game = null;
    this.currentScreen = 'home';
    this.bound = false;
  }

  init() {
    if (!this.bound) this.bindEvents();
    this.renderHome();
    this.scheduleVoiceRefresh();
  }

  bindEvents() {
    this.bound = true;
    this.root.addEventListener('click', async (event) => {
      const target = event.target?.closest?.('[data-mission], [data-action]');
      if (!target) return;
      const missionId = target.dataset?.mission;
      if (missionId) {
        this.startMission(missionId);
        return;
      }

      const action = target.dataset?.action;
      if (!action) return;
      if (this.currentScreen === 'home') {
        await this.handleHomeAction(action);
      } else if (this.game) {
        await this.game.handleAction(action, target);
      }
    });

    this.root.addEventListener('change', (event) => {
      if (event.target?.id !== 'voiceSelect') return;
      const key = event.target.value;
      const voice = this.speech.getVoices().find((item) => voiceKey(item) === key);
      if (voice) this.settings.setVoice(voiceMetadata(voice));
    });
  }

  renderHome() {
    this.currentScreen = 'home';
    this.speech.stopListening?.();
    const voices = this.speech.getVoices();
    let selectedVoice = this.settings.getVoice();
    if (voices.length) {
      const resolved = this.speech.resolveVoice ? this.speech.resolveVoice(selectedVoice) : voices.find((voice) => voiceKey(voice) === voiceKey(selectedVoice)) || voices[0];
      if (resolved && voiceKey(resolved) !== voiceKey(selectedVoice)) {
        selectedVoice = this.settings.setVoice(voiceMetadata(resolved)) || voiceMetadata(resolved);
      } else if (!selectedVoice && resolved) {
        selectedVoice = this.settings.setVoice(voiceMetadata(resolved)) || voiceMetadata(resolved);
      }
    }
    this.root.innerHTML = renderHome({
      voices,
      selectedVoice,
      rewards: this.rewards.snapshot(),
      speechRecognitionAvailable: this.speech.canRecognize(),
      speechSynthesisAvailable: this.speech.canSpeak()
    });
  }

  startMission(missionId) {
    this.currentScreen = 'game';
    this.game = new GameController({
      root: this.root,
      wordModel: this.wordModel,
      sessionModel: this.session,
      rewardModel: this.rewards,
      settingsModel: this.settings,
      speechController: this.speech,
      spellingController: this.spelling,
      onHome: () => this.renderHome()
    });
    this.game.start(missionId);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  async handleHomeAction(action) {
    if (action === 'preview-voice') {
      try {
        await this.speech.speak('Hello! Ready for your Spelling Bee practice?', {
          voiceMetadata: this.settings.getVoice(),
          rate: 0.84
        });
      } catch {
        // Home already displays the browser capability state.
      }
      return;
    }
    if (action === 'reset-progress' && this.confirmReset()) {
      this.rewards.reset();
      this.renderHome();
    }
  }

  scheduleVoiceRefresh() {
    if (typeof window === 'undefined') return;
    const refresh = () => {
      if (this.currentScreen === 'home') this.renderHome();
    };
    const synth = this.speech.synthesis;
    if (synth?.addEventListener) synth.addEventListener('voiceschanged', refresh, { once: false });
    else if (synth) synth.onvoiceschanged = refresh;
    [180, 700, 1500].forEach((delay) => window.setTimeout(refresh, delay));
  }
}
