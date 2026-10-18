import{BOOSTER}from'./booster';
import{hostileContactShape}from'./hostile-shape';
import {advanceProjectile} from './bankshot';
import { C, clamp } from './config';
import { advanceBody } from './behavior';
import type { Body, Bullet, Phase } from './world';

/** Paths/timeline entries use stepFrames fixed simulation frames (default6). */
interface Options { reaction?: number; phase?: Phase; phaseTime?: number; gridPoints?:number; stepFrames?:1|2|3|6 }
type Interval = [number, number];

/** No kills, pickups or invulnerability assumed. Actual emitter/movement rules
 * run at the fixed step. Each slab (default100ms) reserves every hazard crossing the
 * player line, including future shots and charger acceleration. */
export function dangerTimeline(bodies: readonly Body[], bullets: readonly Bullet[], horizon: number, options: Options = {}) {
  const forecastBodies = bodies.filter(b => b.active).map(b => ({ ...b }));
  let forecastBullets = bullets.filter(b => b.active && b.hostile).map(b => ({ ...b }));
  const phase = options.phase ?? (forecastBodies.some(b => b.kind === 'boss') ? 'boss' : 'running');
  const slabs: Interval[][] = [];
  const stepFrames=options.stepFrames??6,slabSeconds=stepFrames*C.step;
  let nextId = -1, time = 0;
  for (let step = 0; step < Math.ceil(horizon / slabSeconds); step++) {
    const intervals: Interval[] = [];
    const reserve = (x0: number, y0: number, x1: number, y1: number, halfX: number, halfY: number) => {
      if (Math.min(y0, y1) - halfY <= C.playerY && Math.max(y0, y1) + halfY >= C.playerY)
        intervals.push([Math.min(x0, x1) - halfX, Math.max(x0, x1) + halfX]);
    };
    for (let sub = 0; sub < stepFrames; sub++) {
      time += C.step;
      for (const b of forecastBodies) {
        const x = b.x, y = b.y;
        advanceBody(b, C.step, phase, (options.phaseTime ?? 0) + time, (sx, sy, vx = 0, vy = 280) => {
          // Ignoring the live bullet budget is conservative, never less dangerous.
          forecastBullets.push({ id: nextId--, x: sx, y: sy, px: sx, py: sy, vx, vy, damage: 1, age: 0, active: true, hostile: true,...(b.pattern==='minelayer'?{mine:true}:b.pattern==='bankshot'?{bankRemaining:1}:b.pattern==='booster'?{boostAfter:BOOSTER.delay,boostFactor:BOOSTER.factor}:{}) });
        },forecastBodies);
        if (b.kind !== 'gate' && b.kind !== 'pickup' && b.kind !== 'boss')
          reserve(x, y, b.x, b.y, b.width / 2 + C.playerRadius + 12, b.height / 2 + C.playerRadius + 12);
      }
      for (const b of forecastBullets) {
        const x = b.x, y = b.y;
        const segments=advanceProjectile(b,C.step);
        const shape=hostileContactShape(b);
        if(segments)for(const s of segments)reserve(s.x0,s.y0,s.x1,s.y1,shape.x+12,shape.y+12);else reserve(x,y,b.x,b.y,shape.x+12,shape.y+12);
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
  const slabSeconds=(options.stepFrames??6)*C.step;
  const start = clamp(x, C.minX, C.maxX);
  const grid=Math.max(25,Math.min(97,Math.floor(options.gridPoints??25)));
  const positions = [...new Set([start, ...Array.from({ length: grid }, (_, i) => C.minX + (C.maxX - C.minX) * i / (grid-1))])].sort((a, b) => a - b);
  let reachable = new Map<number, { cost: number; path: number[] }>([[start, { cost: 0, path: [] }]]);
  const reaction = options.reaction ?? 0.45;
  const timeline = dangerTimeline(bodies, bullets, horizon, options);
  for (let step = 0; step < timeline.length; step++) {
    const next = new Map<number, { cost: number; path: number[] }>();
    const availableMove = C.moveSpeed * Math.max(0, Math.min(slabSeconds, (step + 1) * slabSeconds - reaction));
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
