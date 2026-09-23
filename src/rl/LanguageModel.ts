// Pre-compiled English bigram counts based on standard corpus frequency.
// Tracks common single-character transitions (including space ' ').
const BIGRAM_COUNTS: { [prev: string]: { [next: string]: number } } = {
  ' ': { 't': 180, 'a': 120, 'o': 90, 's': 80, 'i': 80, 'w': 70, 'h': 60, 'f': 50, 'b': 45, 'c': 35, 'm': 35, 'p': 25, 'l': 20 },
  'a': { 'n': 210, 'r': 130, 't': 120, 's': 105, 'd': 75, 'l': 70, 'm': 55, 'g': 45, 'b': 30, 'c': 30, 'v': 30 },
  'b': { 'e': 120, 'u': 70, 'y': 50, 'o': 50, 'l': 40, 'a': 40, 'i': 35, 'r': 30 },
  'c': { 'o': 160, 'h': 130, 'a': 85, 'e': 65, 'i': 55, 'u': 40, 'l': 30, 'r': 30 },
  'd': { 'e': 135, ' ': 125, 'i': 55, 'o': 50, 'a': 45, 'u': 30, 'r': 20 },
  'e': { ' ': 260, 'r': 155, 'n': 125, 's': 115, 'd': 105, 't': 85, 'a': 75, 'v': 65, 'c': 45, 'w': 35, 'x': 20 },
  'f': { 'o': 115, 'r': 75, 'i': 65, 't': 45, 'e': 35, 'a': 30, ' ': 30 },
  'g': { 'e': 75, 'o': 65, 'h': 55, 'r': 45, 'i': 45, 'a': 35, ' ': 30 },
  'h': { 'e': 310, 'a': 135, 'i': 125, 'o': 95, 'u': 55, 'y': 45, 't': 30 },
  'i': { 'n': 240, 's': 145, 't': 115, 'c': 65, 'd': 55, 'l': 55, 'o': 45, 'f': 35, 'm': 35 },
  'j': { 'u': 45, 'o': 35, 'a': 25, 'e': 25 },
  'k': { 'e': 55, 'i': 35, 'y': 25, ' ': 25, 's': 15 },
  'l': { 'e': 115, 'o': 75, 'y': 65, 'l': 55, 'a': 55, 'i': 45, 'd': 35, ' ': 35 },
  'm': { 'e': 115, 'a': 85, 'o': 75, 'y': 55, 'u': 45, 'p': 35, 'i': 35, ' ': 35 },
  'n': { 'd': 165, 'g': 125, 't': 115, 'e': 95, 'o': 85, 'a': 75, 's': 55, ' ': 45, 'i': 35, 'u': 35 },
  'o': { 'f': 135, 'n': 125, 'r': 115, 'u': 105, 'w': 75, 'o': 65, 'm': 55, 'p': 45, 'v': 35, 's': 35 },
  'p': { 'e': 95, 'r': 85, 'o': 65, 'a': 55, 'l': 45, 'i': 35, 'u': 25 },
  'q': { 'u': 65 },
  'r': { 'e': 195, 'o': 95, 'a': 85, 'i': 75, 't': 55, 'd': 45, 's': 45, 'y': 35, ' ': 35 },
  's': { 't': 155, 'h': 115, 'e': 95, 'o': 85, ' ': 75, 'u': 55, 'i': 55, 'a': 45, 'p': 35, 'w': 35 },
  't': { 'h': 360, 'e': 220, 'o': 135, 'a': 95, 'i': 85, ' ': 75, 'r': 55, 's': 45, 'u': 35, 'y': 25 },
  'u': { 'r': 105, 'n': 95, 's': 85, 't': 65, 'p': 45, 'l': 45, 'd': 35, ' ': 25 },
  'v': { 'e': 125, 'i': 45, 'a': 35, 'o': 25 },
  'w': { 'h': 125, 'a': 85, 'e': 65, 'i': 55, 'o': 45, 'r': 35, ' ': 25 },
  'x': { 't': 35, 'p': 25, 'e': 15 },
  'y': { ' ': 155, 'o': 115, 'e': 45, 's': 35, 'u': 35, 't': 25 },
  'z': { 'e': 35, 'o': 25, 'a': 15 }
};

export class LanguageModel {
  /**
   * Retrieves the probability P(next | prev) using Laplace (add-alpha) smoothing.
   * Total vocabulary is 27 (a-z + space).
   */
  public static getBigramProbability(prev: string, next: string, alpha = 0.5): number {
    const p = prev.toLowerCase();
    const n = next.toLowerCase();

    // Map any non-standard char (e.g. numbers, special punctuation) to space for prior matching
    const cleanPrev = /^[a-z]$/.test(p) ? p : ' ';
    const cleanNext = /^[a-z]$/.test(n) ? n : ' ';

    const nextCounts = BIGRAM_COUNTS[cleanPrev] || {};
    const count = nextCounts[cleanNext] || 0;

    // Total transitions starting from cleanPrev
    const totalTransitions = Object.values(nextCounts).reduce((sum, c) => sum + c, 0);

    // Vocabulary size (27 possible next characters: lowercase letters + space)
    const V = 27;

    // Laplace probability formula
    return (count + alpha) / (totalTransitions + V * alpha);
  }
}
