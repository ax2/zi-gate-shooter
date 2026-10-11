import { C } from '../core/config';

export interface PlayerPose { left: number; right: number; bob: number }

/** Presentation only. Distance drives the gait; authoritative simulation time freezes it. */
export class PlayerMotion {
  private x = 360;
  private time = 0;
  private phase = 0;
  private weight = 0;
  reset() { this.x = 360; this.time = 0; this.phase = 0; this.weight = 0; }
  sample(x: number, time: number): PlayerPose {
    if (time < this.time) this.reset();
    const dt = time - this.time;
    if (dt > 0) {
      const distance = Math.abs(x - this.x);
      const speed = Math.min(1, distance / (C.moveSpeed * dt));
      this.weight += (speed - this.weight) * (1 - Math.exp(-18 * dt));
      this.phase = (this.phase + distance * Math.PI * 2 / 112) % (Math.PI * 2);
      this.x = x; this.time = time;
    }
    const stride = Math.sin(this.phase) * 4 * this.weight;
    return { left: stride, right: -stride, bob: -Math.abs(Math.sin(this.phase * 2)) * this.weight };
  }
}
