function toLetters(value) {
  if (Array.isArray(value)) return value.map((letter) => String(letter).toUpperCase());
  return String(value ?? '').toUpperCase().replace(/[^A-Z]/g, '').split('');
}

function operationSignature(result) {
  return result.operations
    .filter(({ type }) => type !== 'match')
    .map(({ type, expected = '', heard = '', expectedIndex = -1, heardIndex = -1 }) =>
      `${type}:${expectedIndex}:${heardIndex}:${expected}:${heard}`
    )
    .join('|');
}

export function alignSpelling(expectedValue, heardValue) {
  const expected = toLetters(expectedValue);
  const heard = toLetters(heardValue);
  const rows = expected.length + 1;
  const cols = heard.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  const step = Array.from({ length: rows }, () => Array(cols).fill(null));

  for (let i = 1; i < rows; i += 1) {
    dp[i][0] = i;
    step[i][0] = 'deletion';
  }
  for (let j = 1; j < cols; j += 1) {
    dp[0][j] = j;
    step[0][j] = 'insertion';
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const same = expected[i - 1] === heard[j - 1];
      const diagonal = dp[i - 1][j - 1] + (same ? 0 : 1);
      const deletion = dp[i - 1][j] + 1;
      const insertion = dp[i][j - 1] + 1;
      const minimum = Math.min(diagonal, deletion, insertion);

      dp[i][j] = minimum;
      if (diagonal === minimum) step[i][j] = same ? 'match' : 'substitution';
      else if (deletion === minimum) step[i][j] = 'deletion';
      else step[i][j] = 'insertion';
    }
  }

  const operations = [];
  let i = expected.length;
  let j = heard.length;

  while (i > 0 || j > 0) {
    const type = step[i][j] ?? (i > 0 ? 'deletion' : 'insertion');
    if (type === 'match' || type === 'substitution') {
      operations.push({
        type,
        expected: expected[i - 1],
        heard: heard[j - 1],
        expectedIndex: i - 1,
        heardIndex: j - 1
      });
      i -= 1;
      j -= 1;
    } else if (type === 'deletion') {
      operations.push({
        type,
        expected: expected[i - 1],
        heard: null,
        expectedIndex: i - 1,
        heardIndex: j
      });
      i -= 1;
    } else {
      operations.push({
        type,
        expected: null,
        heard: heard[j - 1],
        expectedIndex: i,
        heardIndex: j - 1
      });
      j -= 1;
    }
  }

  operations.reverse();
  const distance = dp[expected.length][heard.length];
  const rescueTargets = operations.filter(({ type }) => type === 'substitution' || type === 'deletion');

  return {
    status: distance === 0 ? 'exact' : 'near-match',
    expected,
    heard,
    distance,
    operations,
    rescueTargets
  };
}

export function chooseBestAlignment(expectedValue, candidates = []) {
  const expected = toLetters(expectedValue);
  const useful = candidates
    .map((candidate) => toLetters(candidate))
    .filter((candidate) => candidate.length > 0);

  if (!useful.length) {
    return {
      status: 'retry',
      reason: 'no-evidence',
      expected,
      heard: [],
      distance: expected.length,
      operations: [],
      rescueTargets: []
    };
  }

  const results = useful.map((candidate) => alignSpelling(expected, candidate));
  const minimum = Math.min(...results.map(({ distance }) => distance));
  const best = results.filter(({ distance }) => distance === minimum);

  if (best.length > 1) {
    const signatures = new Set(best.map(operationSignature));
    if (signatures.size > 1) {
      return {
        status: 'retry',
        reason: 'ambiguous-alternatives',
        expected,
        heard: [],
        distance: minimum,
        operations: [],
        rescueTargets: []
      };
    }
  }

  const selected = best[0];
  const denominator = Math.max(expected.length, selected.heard.length, 1);
  const similarity = 1 - selected.distance / denominator;
  if (similarity < 0.45) {
    return { ...selected, status: 'retry', reason: 'insufficient-evidence' };
  }

  return selected;
}
