/** Original procedural sound palette. No downloaded commercial audio. */
export class GameAudio {
  private context?: AudioContext;
  private lastShot = 0;
  private nodes = new Set<OscillatorNode>();
  enabled = true;
  async unlock() {
    try { this.context ??= new AudioContext(); await this.context.resume(); } catch { /* Silent play remains available. */ }
  }
  tone(frequency: number, end: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running' || this.nodes.size >= 12) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(15, end), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain); gain.connect(ctx.destination); this.nodes.add(osc);
    osc.onended = () => { this.nodes.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(now); osc.stop(now + duration);
  }
  event(type: string, stage: number) {
    if (type === 'fire') {
      const now = this.context?.currentTime ?? 0;
      if (now - this.lastShot < 0.10) return;
      this.lastShot = now; this.tone(210 + stage * 65, 70, 0.055, 0.025 + stage * 0.006, 'sawtooth');
    } else if (type === 'upgrade' || type === 'overload') {
      this.tone(360, 1100, 0.35, 0.09, 'sine'); this.tone(540, 1650, 0.4, 0.04, 'triangle');
    } else if (type === 'gate-level') this.tone(600, 900, 0.08, 0.035, 'sine');
    else if (type === 'gate-taken' || type === 'pickup') this.tone(520, 1040, 0.2, 0.055, 'sine');
    else if (type === 'hurt' || type === 'death') this.tone(160, 35, 0.25, 0.1, 'sawtooth');
    else if (type === 'kill' || type === 'crate-break' || type === 'boss-kill') this.tone(95, 22, type === 'boss-kill' ? 0.7 : 0.18, 0.055, 'sawtooth');
  }
  stop() { for (const osc of this.nodes) { try { osc.stop(); } catch { /* Already stopped. */ } } this.nodes.clear(); }
  get activeNodes() { return this.nodes.size; }
}
