// Isolated utility for Scenario Mode's conversation turns.
// This is a fuzzy intelligibility proxy, NOT a true phoneme-level
// pronunciation score. See docs/scenario-mode-guide.md for rationale.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'`]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Returns a 0-100 fuzzy match score between the transcribed text and the
 * expected target phrase. Label this in UI as "~match confidence", never
 * "pronunciation accuracy %".
 */
export function computeMatchScore(transcribed: string, expected: string): number {
  const a = normalize(transcribed);
  const b = normalize(expected);
  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const score = 100 * (1 - dist / maxLen);
  return Math.max(0, Math.min(100, Math.round(score)));
}
