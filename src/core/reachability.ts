import { C } from './config';
import type { Body, Bullet } from './world';

/** Time-expanded reachable positions, including the current player position. */
export function safeRoute(x: number, bodies: readonly Body[], bullets: readonly Bullet[], horizon = 3) {
  const count = 25, dx = (C.maxX - C.minX) / (count - 1), dt = 0.1;
  const position = (index: number) => C.minX + index * dx;
  const nearest = Math.round((x - C.minX) / dx);
  let reachable = new Map<number, number[]>([[Math.max(0, Math.min(count - 1, nearest)), []]]);
  for (let step = 1; step <= Math.ceil(horizon / dt); step++) {
    const t = step * dt, next = new Map<number, number[]>();
    for (let i = 0; i < count; i++) {
      const px = position(i);
      const blocked = bodies.some(b => {
        if (!b.active || b.kind === 'gate' || b.kind === 'pickup' || b.kind === 'boss') return false;
        let distance = b.speed * t;
        if (b.kind === 'charger' && b.age < 2.6) { const before = Math.min(t, 2.6 - b.age); distance = b.speed * before + 380 * (t - before); }
        const y = b.y + distance;
        return Math.abs(y - C.playerY) < b.height / 2 + 32 + b.speed * dt / 2 && Math.abs(px - b.x) < b.width / 2 + 32;
      }) || bullets.some(b => b.active && b.hostile && Math.abs(b.y + b.vy * t - C.playerY) < 36 + b.vy * dt / 2 && Math.abs(b.x + b.vx * t - px) < 33);
      if (blocked) continue;
      for (const [previous, path] of reachable) if (Math.abs(position(previous) - px) <= C.moveSpeed * dt) { next.set(i, [...path, px]); break; }
    }
    reachable = next;
    if (!reachable.size) return null;
  }
  let best: number[] | null = null, bestCost = Infinity;
  for (const path of reachable.values()) {
    const cost = path.reduce((sum, p, index) => sum + Math.abs(p - (index ? path[index - 1] : x)), 0);
    if (cost < bestCost) { best = path; bestCost = cost; }
  }
  return best;
}
