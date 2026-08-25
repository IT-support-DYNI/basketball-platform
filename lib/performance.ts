/*
 * Overall evaluation score is auto-computed from category scores
 * rather than entered separately by the coach — ARCHITECTURE.md §6.3.
 */
export function computeOverallScore(categoryScores: number[]): number {
  if (categoryScores.length === 0) {
    throw new Error("Cannot compute an overall score with zero category scores");
  }

  const sum = categoryScores.reduce((total, score) => total + score, 0);
  return Math.round((sum / categoryScores.length) * 10) / 10;
}
