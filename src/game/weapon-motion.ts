import type { WeaponKind } from '../core/weapons';

/** One bounded presentation impulse per actual shot; simulation time freezes on pause. */
export class WeaponMotion {
  private firedAt = -Infinity;
  private kind: WeaponKind = 'pulse';
  private stage = 1;
  reset() { this.firedAt = -Infinity; }
  fire(kind: WeaponKind, stage: number, time: number) {
    this.kind = kind; this.stage = stage; this.firedAt = time;
  }
  flash(kind: WeaponKind, stage: number, time: number): number {
    if (kind !== this.kind || stage !== this.stage) return 0;
    const age = time - this.firedAt;
    const duration = kind === 'pulse' ? 0.05 : kind === 'scatter' ? 0.075 : 0.095;
    return age < 0 ? 0 : Math.max(0, 1 - age / duration);
  }
  sample(kind: WeaponKind, stage: number, time: number): number {
    if (kind !== this.kind || stage !== this.stage) return 0;
    const age = time - this.firedAt;
    const duration = kind === 'pulse' ? 0.085 : kind === 'scatter' ? 0.18 : 0.195;
    if (age < 0 || age >= duration) return 0;
    const t = age / duration;
    const strength = (kind === 'pulse' ? 3 : kind === 'scatter' ? 7 : 5.5)
      * (1 + (Math.max(1, Math.min(3, stage)) - 1) * 0.12);
    // Fast impact, then a distinct recovery: scatter springs past rest;
    // the heavy rail assembly holds briefly before smoothly returning.
    if (kind === 'scatter') return strength * Math.sin(t * Math.PI * 2) * (1 - t);
    if (kind === 'pierce') return strength * (t < 0.15 ? t / 0.15 : t < 0.4 ? 1 : (1 + Math.cos((t - 0.4) / 0.6 * Math.PI)) / 2);
    return strength * Math.sin(t * Math.PI) * (1 - t);
  }
}
