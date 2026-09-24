export class SettingsModel {
  constructor(storage) {
    this.storage = storage;
    this.state = storage.load();
  }

  refresh() {
    this.state = this.storage.load();
    return this.state;
  }

  getVoice() {
    this.refresh();
    return this.state.selectedVoice ? { ...this.state.selectedVoice } : null;
  }

  setVoice(voice) {
    this.refresh();
    this.state.selectedVoice = voice
      ? { name: String(voice.name ?? ''), lang: String(voice.lang ?? ''), voiceURI: String(voice.voiceURI ?? '') }
      : null;
    this.state = this.storage.save(this.state);
    return this.state.selectedVoice ? { ...this.state.selectedVoice } : null;
  }
}
