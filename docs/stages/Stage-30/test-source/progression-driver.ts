import { C, clamp } from '../../src/core/config';
import { dangerTimeline, safeRoute } from '../../src/core/reachability';
import type { World } from '../../src/core/world';

/** Test-only omniscient operator. Never writes World state or suppresses effects.
 * Forecasting is a control aid, not the acceptance oracle: actual World contacts,
 * rewards and phase transitions supply all measured outcomes. */
export function progressionTarget(world: World) {
  const x = world.player.x;
  const bodies = world.bodies.filter(b => b.active);
  const equipment = bodies.filter(b => b.kind === 'pickup' || b.kind === 'crate')
    .sort((a, b) => Number(b.stage > world.growth.stage) - Number(a.stage > world.growth.stage) || b.y - a.y)[0];
  const gate = bodies.filter(b => b.kind === 'gate').sort((a, b) => b.y - a.y || Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  const enemy = bodies.filter(b => b.kind in C.enemies).sort((a, b) => b.y - a.y)[0];
  const boss = bodies.find(b => b.kind === 'boss');
  const goal = clamp((equipment ?? gate ?? boss ?? enemy)?.x ?? x, C.minX, C.maxX);
  const next = x + clamp(goal - x, -C.moveSpeed * .1, C.moveSpeed * .1);
  const options = { phase: world.phase, phaseTime: world.phaseTime, reaction: 0 };
  // If the aiming segment remains clear through the next 1.5s, approach it.
  // Otherwise follow the conservative escape planner, without assuming kills.
  const hazards = dangerTimeline(world.bodies, world.bullets, 1.5, options);
  const blocked = hazards.some(intervals => intervals.some(([lo, hi]) => Math.max(x, next) >= lo && Math.min(x, next) <= hi));
  if (!blocked) return next;
  return safeRoute(x, world.bodies, world.bullets, 4, options)?.[0] ?? x;
}
