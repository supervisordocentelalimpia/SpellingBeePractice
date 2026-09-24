import { WORDS } from '../data/words.js';
import { sample } from '../utils/random.js';

export class WordModel {
  constructor(words = WORDS) {
    this.words = [...words];
  }

  count() {
    return this.words.length;
  }

  all() {
    return this.words.map((item) => ({ ...item }));
  }

  getByWord(word) {
    const needle = String(word ?? '').toLowerCase();
    const found = this.words.find((item) => item.word === needle);
    return found ? { ...found } : null;
  }

  pick(count = 1, random = Math.random) {
    return sample(this.words, count, random).map((item) => ({ ...item }));
  }
}
