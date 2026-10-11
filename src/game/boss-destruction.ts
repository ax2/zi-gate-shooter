/** Presentation only. No timers, rewards or collision objects enter World. */
export const BOSS_VISUAL = { width: 360, height: 280, offsetY: 50 } as const;
export class BossDestruction {
  age = 0;
  private next = 0;
  static readonly lifetime = 1.35;
  private static readonly bursts = [
    { at: 0, x: -112, y: 90, size: 85 },
    { at: 0.16, x: 112, y: 90, size: 85 },
    { at: 0.34, x: 0, y: -25, size: 92 },
    { at: 0.56, x: 0, y: 25, size: 140 },
  ];
  constructor(readonly x: number, readonly y: number) {}
  advance(dt: number) {
    this.age += Math.max(0, dt);
    const due = [];
    while (this.next < BossDestruction.bursts.length && BossDestruction.bursts[this.next].at <= this.age) {
      const burst = BossDestruction.bursts[this.next++];
      due.push({ x: this.x + burst.x, y: this.y + burst.y, size: burst.size });
    }
    return due;
  }
  get finished() { return this.age >= BossDestruction.lifetime; }
  get pieces() {
    const t = Math.max(0, this.age - 0.12);
    const alpha = Math.max(0, 1 - Math.max(0, this.age - 0.35) / (BossDestruction.lifetime - 0.35));
    return [
      { from: 0, width: 0.32, dx: -85 * t, dy: 48 * t, angle: -0.35 * t, alpha },
      { from: 0.32, width: 0.36, dx: 0, dy: 30 * t, angle: 0.04 * t, alpha },
      { from: 0.68, width: 0.32, dx: 85 * t, dy: 48 * t, angle: 0.35 * t, alpha },
    ];
  }
}
