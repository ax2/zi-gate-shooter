/** Decorative fragments only; reserve three of the global twelve slots for boss wreckage. */
export class CrateDebris {
  readonly pieces: Array<{ frame: number; x: number; y: number; vx: number; vy: number; angle: number; spin: number; age: number; life: number; size: number }> = [];
  burst(x: number, y: number) {
    while (this.pieces.length > 3) this.pieces.shift();
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI + i * Math.PI * 2 / 6;
      this.pieces.push({ frame: 3 + i, x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * (80 + i * 8), vy: 70 + Math.sin(angle) * 65,
        angle: 0, spin: (i % 2 ? -1 : 1) * (1 + i * 0.15), age: 0, life: 0.75 + i * 0.045, size: i === 0 ? 54 : 38 });
    }
  }
  advance(dt: number) {
    for (const p of this.pieces) {
      p.x += p.vx * dt; p.y += p.vy * dt + 90 * dt * dt; p.vy += 180 * dt;
      p.angle += p.spin * dt; p.age += dt;
    }
    for (let i = this.pieces.length - 1; i >= 0; i--) if (this.pieces[i].age >= this.pieces[i].life) this.pieces.splice(i, 1);
  }
  clear() { this.pieces.length = 0; }
}

export const crateFrame = (hp: number, maxHp: number) => hp > maxHp * 0.75 ? 0 : hp > maxHp * 0.35 ? 1 : 2;
