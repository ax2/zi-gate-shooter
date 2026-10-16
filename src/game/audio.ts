import type { WeaponKind } from '../core/weapons';
/** Original procedural sound palette. No downloaded commercial audio. */
export class GameAudio {
  private context?: AudioContext;
  private lastShot = -Infinity;
  private lastRefraction = -Infinity;
  private lastLaser = -Infinity;
  private lastFracture = -Infinity;
  private lastCapacitor = -Infinity;
  private lastScatterBurst = -Infinity;
  private nodes = new Map<OscillatorNode, GainNode>();
  private retryAt = 0;
  enabled = true;
  constructor(private now: () => number = () => performance.now()) {}
  async unlock() {
    if (this.now() < this.retryAt) return;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.stop(); this.context = new AudioContext(); this.lastShot = -Infinity;
      }
      await this.context.resume();
    } catch {
      this.stop(); this.retryAt = this.now() + 5000;
      const failed = this.context; this.context = undefined;
      try { if (failed) void failed.close().catch(() => {}); } catch { /* Platform is unavailable. */ }
    }
  }
  private release(osc: OscillatorNode, gain: GainNode) {
    if (!this.nodes.delete(osc)) return;
    osc.onended = null;
    try { osc.disconnect(); } catch { /* Already disconnected. */ }
    try { gain.disconnect(); } catch { /* Already disconnected. */ }
  }
  tone(frequency: number, end: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running' || this.nodes.size >= 12 || this.now() < this.retryAt) return;
    let osc: OscillatorNode | undefined, gain: GainNode | undefined;
    try {
      osc = ctx.createOscillator(); gain = ctx.createGain();
      const now = ctx.currentTime;
      this.nodes.set(osc, gain);
      osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(15, end), now + duration);
      gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      const voice = osc, envelope = gain;
      osc.onended = () => this.release(voice, envelope);
      osc.start(now); osc.stop(now + duration);
    } catch {
      // A partly created voice also needs cleanup if createGain failed.
      if (osc && !gain) { try { osc.disconnect(); } catch { /* Platform failure. */ } }
      this.stop(); this.retryAt = this.now() + 5000;
    }
  }
  event(type: string, stage: number, weapon: WeaponKind = 'pulse') {
    if(type==='alert'){this.tone(240,110,.2,.035,'triangle');return;}
    if(type==='shield-down'){this.tone(480,1300,.2,.04,'sine');this.tone(220,70,.18,.025,'triangle');return;}
    if (type === 'laser') {
      if (this.now() - this.lastLaser < 500) return;
      this.lastLaser = this.now();
      this.tone(1250, 260, .26, .035, 'sine');
      this.tone(210, 75, .18, .025, 'triangle');
      return;
    }
    if (type === 'refract') {
      if (this.now() - this.lastRefraction < 180) return;
      this.lastRefraction = this.now();
      this.tone(1550, 2300, .075, .018, 'sine');
      return;
    }
    if (type === 'arc') { this.tone(850,180,.09,.025,'sawtooth'); return; }
    if(type==='ion-storm'){this.tone(110,40,.24,.04,'triangle');this.tone(2100,220,.16,.025,'sawtooth');return;}
    if(type==='capacitor'){
      if(this.now()-this.lastCapacitor<150)return;this.lastCapacitor=this.now();
      this.tone(1700,180,.12,.035,'sawtooth');this.tone(320,55,.18,.04,'triangle');return;
    }
    if(type==='fracture'){
      if(this.now()-this.lastFracture<150)return;this.lastFracture=this.now();
      this.tone(900,120,.09,.035,'sawtooth');this.tone(100,25,.25,.07,'triangle');return;
    }
    if(type==='scatter-burst'){
      if(this.now()-this.lastScatterBurst<150)return;this.lastScatterBurst=this.now();
      this.tone(250,65,.12,.035,'triangle');return;
    }
    if (type === 'blast') { this.tone(130,30,.2,.07,'triangle'); return; }
    if (type === 'fire') {
      const now = this.context?.currentTime ?? 0;
      if (now - this.lastShot < 0.10) return;
      this.lastShot = now;
      if (weapon === 'arc') { this.tone(600,120,.11,.035,'sawtooth'); return; }
      if (weapon === 'blast') { this.tone(170,32,.18,.045,'triangle'); return; }
      this.tone((210 + stage * 65) * (weapon === 'pierce' ? .65 : weapon === 'scatter' ? .85 : 1), weapon === 'pierce' ? 35 : 70,
        weapon === 'pierce' ? .12 : weapon === 'scatter' ? .08 : .055, 0.025 + stage * 0.006, weapon === 'pierce' ? 'triangle' : 'sawtooth');
    } else if (type === 'upgrade' || type === 'overload' || type === 'weapon') {
      this.tone(360, 1100, 0.35, 0.09, 'sine'); this.tone(540, 1650, 0.4, 0.04, 'triangle');
    } else if (type === 'gate-level') this.tone(600, 900, 0.08, 0.035, 'sine');
    else if (type === 'gate-taken' || type === 'pickup') this.tone(520, 1040, 0.2, 0.055, 'sine');
    else if (type === 'hurt' || type === 'death') this.tone(160, 35, 0.25, 0.1, 'sawtooth');
    else if (type === 'kill' || type === 'crate-break' || type === 'boss-kill') this.tone(95, 22, type === 'boss-kill' ? 0.7 : 0.18, 0.055, 'sawtooth');
  }
  stop() {
    for (const [osc, gain] of this.nodes) {
      try { osc.stop(); } catch { /* Already stopped or platform failure. */ }
      this.release(osc, gain);
    }
  }
  get activeNodes() { return this.nodes.size; }
}
