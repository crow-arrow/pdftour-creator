/**
 * Increments quote number in format Q-YYYY-NNN.
 * Example: Q-2026-018 → Q-2026-019
 * On year change: Q-2026-999 → Q-2027-001
 */
export function getNextQuoteNumber(current: string): string {
  const match = current.match(/^(Q)-(\d{4})-(\d+)$/i);
  if (!match) {
    return current;
  }
  const prefix = match[1].toUpperCase();
  let year = parseInt(match[2], 10);
  let seq = parseInt(match[3], 10);

  seq += 1;
  if (seq > 999) {
    seq = 1;
    year += 1;
  }

  const seqStr = String(seq).padStart(3, "0");
  return `${prefix}-${year}-${seqStr}`;
}
