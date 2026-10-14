export type WreckKind = 'drone' | 'charger' | 'armor' | 'elite' | 'sniper';
export const wreckLayout = {
  drone: { w: 92.4, h: 92.4, life: .55 }, charger: { w: 105.3, h: 105.3, life: .55 },
  sniper: { w: 140, h: 140, life: .55 },
  armor: { w: 124.7, h: 140.76, life: .55 }, elite: { w: 198.24, h: 184.96, life: .65 },
} as const;
export const isWreckKind = (kind: unknown): kind is WreckKind => typeof kind === 'string' && Object.prototype.hasOwnProperty.call(wreckLayout, kind);

/** Cosmetic only. All ordinary/elite wrecks share one bounded pool below live entities. */
export class EnemyWreck {
  readonly pieces: Array<{ kind: WreckKind; from: number; width: number; w: number; h: number; life: number; x: number; y: number; vx: number; vy: number; angle: number; spin: number; age: number }> = [];
  trim(limit: number) { while (this.pieces.length > Math.max(0, limit)) this.pieces.shift(); }
  burst(x: number, y: number, limit: number, kind: WreckKind = 'drone') {
    if (limit < 3) return;
    this.trim(Math.min(6, limit) - 3);
    const layout = wreckLayout[kind], heavy = kind === 'armor' || kind === 'elite';
    for (const [index, from, width] of [[0,0,.34],[1,.34,.32],[2,.66,.34]]) {
      this.pieces.push({ kind, ...layout, from, width, x: x + (from + width / 2 - .5) * layout.w, y,
        vx: (index - 1) * (heavy ? 38 : 52), vy: (heavy ? 55 : 90) + index * 12,
        angle: 0, spin: (index - 1) * (heavy ? .8 : 1.5), age: 0 });
    }
  }
  advance(dt: number) {
    for (const p of this.pieces) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.angle += p.spin * dt; }
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].age >= this.pieces[i].life) this.pieces.splice(i, 1);
  }
  clear() { this.pieces.length = 0; }
}
