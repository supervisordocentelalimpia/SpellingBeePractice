import { DEFAULT_STATE } from '../utils/storage.js';

export class RewardModel {
  constructor(storage) {
    this.storage = storage;
    this.state = storage.load();
  }

  refresh() {
    this.state = this.storage.load();
    return this.state;
  }

  snapshot() {
    this.refresh();
    return JSON.parse(JSON.stringify(this.state));
  }

  addStars(count = 1) {
    this.refresh();
    const amount = Math.max(0, Number(count) || 0);
    this.state.stars += amount;
    this.state = this.storage.save(this.state);
    return this.state.stars;
  }

  fillHoneycomb(count = 1) {
    this.refresh();
    const amount = Math.max(0, Number(count) || 0);
    this.state.honeycomb = Math.min(12, this.state.honeycomb + amount);
    this.state = this.storage.save(this.state);
    return this.state.honeycomb;
  }

  unlockBadge(name) {
    this.refresh();
    const badge = String(name ?? '').trim();
    if (badge && !this.state.badges.includes(badge)) this.state.badges.push(badge);
    this.state = this.storage.save(this.state);
    return [...this.state.badges];
  }

  recordPractice({ exact = false, rescuedLetters = 0, missionId = '', missionComplete = false } = {}) {
    this.refresh();
    this.state.stats.practiced += 1;
    if (exact) this.state.stats.exact += 1;
    this.state.stats.rescuedLetters += Math.max(0, Number(rescuedLetters) || 0);
    if (missionComplete && missionId && !this.state.stats.completedMissions.includes(missionId)) {
      this.state.stats.completedMissions.push(missionId);
    }
    this.state = this.storage.save(this.state);
    return this.snapshot();
  }

  reset() {
    this.state = this.storage.reset();
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}
