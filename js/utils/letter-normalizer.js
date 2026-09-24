const TOKEN_TO_LETTER = new Map([
  ['a', 'A'], ['ay', 'A'], ['hey', 'A'],
  ['b', 'B'], ['bee', 'B'], ['be', 'B'],
  ['c', 'C'], ['see', 'C'], ['sea', 'C'],
  ['d', 'D'], ['dee', 'D'],
  ['e', 'E'], ['ee', 'E'],
  ['f', 'F'], ['ef', 'F'],
  ['g', 'G'], ['gee', 'G'],
  ['h', 'H'], ['aitch', 'H'], ['age', 'H'],
  ['i', 'I'], ['eye', 'I'],
  ['j', 'J'], ['jay', 'J'],
  ['k', 'K'], ['kay', 'K'],
  ['l', 'L'], ['el', 'L'],
  ['m', 'M'], ['em', 'M'],
  ['n', 'N'], ['en', 'N'],
  ['o', 'O'], ['oh', 'O'],
  ['p', 'P'], ['pee', 'P'],
  ['q', 'Q'], ['cue', 'Q'], ['queue', 'Q'],
  ['r', 'R'], ['are', 'R'],
  ['s', 'S'], ['ess', 'S'],
  ['t', 'T'], ['tee', 'T'], ['tea', 'T'],
  ['u', 'U'], ['you', 'U'],
  ['v', 'V'], ['vee', 'V'],
  ['w', 'W'], ['double-u', 'W'], ['double-you', 'W'],
  ['x', 'X'], ['ex', 'X'],
  ['y', 'Y'], ['why', 'Y'],
  ['z', 'Z'], ['zee', 'Z']
]);

const FILLERS = new Set([
  'um', 'uh', 'okay', 'ok', 'letter', 'letters', 'please', 'is', 'it', 'the',
  'and', 'then', 'next', 'again', 'excuse', 'me'
]);

function tokenize(input) {
  return String(input ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/double[\s-]+you\b/g, 'double-you')
    .replace(/double[\s-]+u\b/g, 'double-u')
    .replace(/[^a-z-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeTranscript(input) {
  const tokens = tokenize(input);
  if (!tokens.length) return [];

  const letters = [];
  let unknown = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === 'double-you' || token === 'double-u') {
      letters.push('W');
      continue;
    }

    if (token === 'double') {
      const next = tokens[index + 1];
      const nextLetter = TOKEN_TO_LETTER.get(next);
      if (nextLetter) {
        letters.push(nextLetter, nextLetter);
        index += 1;
        continue;
      }
      unknown += 1;
      continue;
    }

    const letter = TOKEN_TO_LETTER.get(token);
    if (letter) {
      letters.push(letter);
      continue;
    }

    if (!FILLERS.has(token)) unknown += 1;
  }

  if (!letters.length) return [];
  if (unknown > 0 && letters.length <= 1) return [];
  if (unknown > letters.length) return [];
  return letters;
}

export function normalizeAlternatives(transcripts = []) {
  const unique = new Map();
  for (const transcript of transcripts) {
    const sequence = normalizeTranscript(transcript);
    if (!sequence.length) continue;
    const key = sequence.join('');
    if (!unique.has(key)) unique.set(key, sequence);
  }
  return [...unique.values()];
}
