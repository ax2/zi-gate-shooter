/** Candidate score-only reward. Window is fixed from its first kill, never extended. */
export const RAPID_BREAK = {window: .8, reading: .9, thresholds: [3, 6, 9], bonuses: [10, 25, 50]} as const;
export class RapidBreak {
  private started = -1;
  private count = 0;
  private earned = 0;
  totalBonus = 0;
  best = 0;
  chains = 0;
  last: {count: number; bonus: number; at: number} | null = null;
  kill(time: number): number {
    if (this.started < 0 || time - this.started > RAPID_BREAK.window + 1e-9) {
      this.started = time; this.count = 0; this.earned = 0;
    }
    this.count++; this.best = Math.max(this.best, this.count);
    let bonus = 0;
    RAPID_BREAK.thresholds.forEach((n, i) => {if (this.count >= n) bonus = RAPID_BREAK.bonuses[i];});
    const delta = bonus - this.earned;
    if (bonus) {
      if (!this.earned) this.chains++;
      this.earned = bonus; this.totalBonus += delta;
      this.last = {count: this.count, bonus, at: time};
    }
    return delta;
  }
  readout(time: number) {
    return this.last && time - this.last.at <= RAPID_BREAK.reading ? this.last : null;
  }
}
