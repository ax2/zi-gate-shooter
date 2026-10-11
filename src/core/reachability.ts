import { C, clamp } from './config';
import { advanceBody } from './behavior';
import type { Body, Bullet, Phase } from './world';

interface Options { reaction?: number; phase?: Phase; phaseTime?: number }
type Interval = [number, number];

/** No kills, pickups or invulnerability assumed. Actual emitter/movement rules
 * run at the fixed step. Each 100ms slab reserves every hazard crossing the
 * player line, including future shots and charger acceleration. */
export function dangerTimeline(bodies: readonly Body[], bullets: readonly Bullet[], horizon: number, options: Options = {}) {
  const forecastBodies = bodies.filter(b => b.active).map(b => ({ ...b }));
  let forecastBullets = bullets.filter(b => b.active && b.hostile).map(b => ({ ...b }));
  const phase = options.phase ?? (forecastBodies.some(b => b.kind === 'boss') ? 'boss' : 'running');
  const slabs: Interval[][] = [];
  let nextId = -1, time = 0;
  for (let step = 0; step < Math.ceil(horizon / 0.1); step++) {
    const intervals: Interval[] = [];
    const reserve = (x0: number, y0: number, x1: number, y1: number, halfX: number, halfY: number) => {
      if (Math.min(y0, y1) - halfY <= C.playerY && Math.max(y0, y1) + halfY >= C.playerY)
        intervals.push([Math.min(x0, x1) - halfX, Math.max(x0, x1) + halfX]);
    };
    for (let sub = 0; sub < 6; sub++) {
      time += C.step;
      for (const b of forecastBodies) {
        const x = b.x, y = b.y;
        advanceBody(b, C.step, phase, (options.phaseTime ?? 0) + time, (sx, sy, vx = 0, vy = 280) => {
          // Ignoring the live bullet budget is conservative, never less dangerous.
          forecastBullets.push({ id: nextId--, x: sx, y: sy, px: sx, py: sy, vx, vy, damage: 1, age: 0, active: true, hostile: true });
        });
        if (b.kind !== 'gate' && b.kind !== 'pickup' && b.kind !== 'boss')
          reserve(x, y, b.x, b.y, b.width / 2 + C.playerRadius + 12, b.height / 2 + C.playerRadius + 12);
      }
      for (const b of forecastBullets) {
        const x = b.x, y = b.y;
        b.x += b.vx * C.step; b.y += b.vy * C.step; b.age += C.step;
        reserve(x, y, b.x, b.y, 39, 43);
      }
      forecastBullets = forecastBullets.filter(b => b.age < 6 && b.y < 1370 && b.x > -40 && b.x < 760);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: Interval[] = [];
    for (const interval of intervals) {
      const last = merged[merged.length - 1];
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
      else merged.push([...interval]);
    }
    slabs.push(merged);
  }
  return slabs;
}

/** Exact initial x, reaction + spare time, and the entire lateral segment of
 * every move are checked. Null means the conservative grid cannot prove a path. */
export function safeRoute(x: number, bodies: readonly Body[], bullets: readonly Bullet[], horizon = 3, options: Options = {}) {
  const start = clamp(x, C.minX, C.maxX);
  const positions = [...new Set([start, ...Array.from({ length: 25 }, (_, i) => C.minX + (C.maxX - C.minX) * i / 24)])].sort((a, b) => a - b);
  let reachable = new Map<number, { cost: number; path: number[] }>([[start, { cost: 0, path: [] }]]);
  const reaction = options.reaction ?? 0.45;
  const timeline = dangerTimeline(bodies, bullets, horizon, options);
  for (let step = 0; step < timeline.length; step++) {
    const next = new Map<number, { cost: number; path: number[] }>();
    const availableMove = C.moveSpeed * Math.max(0, Math.min(0.1, (step + 1) * 0.1 - reaction));
    for (const px of positions) for (const [previous, value] of reachable) {
      const distance = Math.abs(previous - px);
      if (distance > availableMove + 1e-8) continue;
      if (timeline[step].some(([lo, hi]) => Math.max(previous, px) >= lo && Math.min(previous, px) <= hi)) continue;
      const cost = value.cost + distance;
      if (!next.has(px) || next.get(px)!.cost > cost) next.set(px, { cost, path: [...value.path, px] });
    }
    reachable = next;
    if (!reachable.size) return null;
  }
  return [...reachable.values()].sort((a, b) => a.cost - b.cost)[0]?.path ?? [];
}
