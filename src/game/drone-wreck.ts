/** Cosmetic only: three sections of a dead drone, below all live entities and dangers. */
export class DroneWreck {
  readonly pieces: Array<{ from: number; width: number; x: number; y: number; vx: number; vy: number; angle: number; spin: number; age: number }> = [];
  trim(limit: number) { while (this.pieces.length > Math.max(0, limit)) this.pieces.shift(); }
  burst(x: number, y: number, limit: number) {
    // Keep complete three-piece wrecks; omit decoration if higher-priority crate pieces occupy the budget.
    if (limit < 3) return;
    this.trim(Math.min(6, limit) - 3);
    for (const [index, from, width] of [[0,0,.34],[1,.34,.32],[2,.66,.34]]) {
      this.pieces.push({ from, width, x: x + (from + width / 2 - .5) * 92.4, y,
        vx: (index - 1) * 52, vy: 90 + index * 12, angle: 0, spin: (index - 1) * 1.5, age: 0 });
    }
  }
  advance(dt: number) {
    for (const p of this.pieces) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.angle += p.spin * dt; }
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].age >= .55) this.pieces.splice(i, 1);
  }
  clear() { this.pieces.length = 0; }
}
