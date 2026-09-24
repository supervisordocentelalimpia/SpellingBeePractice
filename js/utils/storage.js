export const STORAGE_KEY = 'cevaz.spellingBee.level1.v1';

export const DEFAULT_STATE = Object.freeze({
  version: 1,
  selectedVoice: null,
  stars: 0,
  honeycomb: 0,
  badges: [],
  stats: {
    practiced: 0,
    exact: 0,
    rescuedLetters: 0,
    completedMissions: []
  }
});

const clone = (value) => JSON.parse(JSON.stringify(value));

function memoryAdapter() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

function sanitize(candidate) {
  if (!candidate || candidate.version !== 1) return clone(DEFAULT_STATE);
  const stats = candidate.stats ?? {};
  return {
    version: 1,
    selectedVoice: candidate.selectedVoice && typeof candidate.selectedVoice === 'object'
      ? {
          name: String(candidate.selectedVoice.name ?? ''),
          lang: String(candidate.selectedVoice.lang ?? ''),
          voiceURI: String(candidate.selectedVoice.voiceURI ?? '')
        }
      : null,
    stars: Math.max(0, Number(candidate.stars) || 0),
    honeycomb: Math.max(0, Math.min(12, Number(candidate.honeycomb) || 0)),
    badges: [...new Set(Array.isArray(candidate.badges) ? candidate.badges.map(String) : [])],
    stats: {
      practiced: Math.max(0, Number(stats.practiced) || 0),
      exact: Math.max(0, Number(stats.exact) || 0),
      rescuedLetters: Math.max(0, Number(stats.rescuedLetters) || 0),
      completedMissions: [...new Set(Array.isArray(stats.completedMissions) ? stats.completedMissions.map(String) : [])]
    }
  };
}

export function createStorage(adapter) {
  let target = adapter;
  if (!target) {
    try {
      target = globalThis.localStorage;
    } catch {
      target = null;
    }
  }
  if (!target || typeof target.getItem !== 'function') target = memoryAdapter();

  return {
    load() {
      try {
        const raw = target.getItem(STORAGE_KEY);
        if (!raw) return clone(DEFAULT_STATE);
        return sanitize(JSON.parse(raw));
      } catch {
        return clone(DEFAULT_STATE);
      }
    },
    save(state) {
      const safe = sanitize(state);
      try {
        target.setItem(STORAGE_KEY, JSON.stringify(safe));
      } catch {
        // Storage can be blocked. The app remains usable in memory through callers.
      }
      return clone(safe);
    },
    reset() {
      try {
        target.removeItem(STORAGE_KEY);
      } catch {
        // Ignore blocked storage.
      }
      return clone(DEFAULT_STATE);
    }
  };
}
