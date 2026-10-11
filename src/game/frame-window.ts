/** Local rolling frame-interval evidence, never simulation/gameplay timing. */
export class FrameWindow {
  private values: Float64Array;
  private cursor = 0;
  private count = 0;
  constructor(readonly capacity = 36000) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError('Invalid frame sample capacity');
    this.values = new Float64Array(capacity);
  }
  add(milliseconds: number) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
    this.values[this.cursor] = milliseconds;
    this.cursor = (this.cursor + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }
  clear() { this.cursor = 0; this.count = 0; }
  snapshot() {
    const sorted = Array.from(this.values.subarray(0, this.count)).sort((a, b) => a - b);
    const percentile = (fraction: number) => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
    return { frameSamples: this.count, sampleLimit: this.capacity,
      frameSampleSeconds: sorted.reduce((sum, value) => sum + value, 0) / 1000,
      p95: percentile(.95), p99: percentile(.99),
      over33msPercent: this.count ? sorted.filter(value => value > 1000 / 30).length / this.count * 100 : 0 };
  }
}
