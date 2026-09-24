export class SessionModel {
  constructor() {
    this.state = {
      missionId: null,
      currentWord: null,
      streak: 0,
      attempts: 0,
      rescuedThisWord: 0
    };
  }

  startMission(missionId) {
    this.state.missionId = missionId;
    this.state.currentWord = null;
    this.state.streak = 0;
    this.state.attempts = 0;
    this.state.rescuedThisWord = 0;
  }

  setWord(word) {
    this.state.currentWord = word ? { ...word } : null;
    this.state.attempts = 0;
    this.state.rescuedThisWord = 0;
  }

  recordAttempt() {
    this.state.attempts += 1;
  }

  recordRescue() {
    this.state.rescuedThisWord += 1;
  }

  markExact() {
    this.state.streak += 1;
  }

  markMiss() {
    this.state.streak = 0;
  }

  snapshot() {
    return {
      ...this.state,
      currentWord: this.state.currentWord ? { ...this.state.currentWord } : null
    };
  }
}
