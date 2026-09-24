import { normalizeAlternatives } from '../utils/letter-normalizer.js';
import { chooseBestAlignment } from '../utils/sequence-aligner.js';

export class SpellingController {
  evaluateTranscripts(expectedWord, alternatives = []) {
    const candidates = normalizeAlternatives(alternatives);
    const result = chooseBestAlignment(expectedWord, candidates);
    return { ...result, candidates };
  }

  evaluateLetter(expectedLetter, alternatives = []) {
    const expected = String(expectedLetter ?? '').trim().toUpperCase().slice(0, 1);
    const candidates = normalizeAlternatives(alternatives);
    const rescued = candidates.some((candidate) => candidate.length === 1 && candidate[0] === expected);
    return {
      rescued,
      expected,
      candidates,
      status: rescued ? 'exact' : (candidates.length ? 'near-match' : 'retry')
    };
  }
}
