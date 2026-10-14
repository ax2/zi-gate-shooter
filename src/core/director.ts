import type { EnemyKind } from './config';
export interface Spawn { at: number; kind: EnemyKind | 'crate' | 'gates' | 'armory'; x: number; stage?: number; pair?: boolean; pattern?: 'weave' | 'flank' | 'fan'; lane?: number }
export const sectorNames = ['突围走廊', '侧翼夹击', '重装封锁'];
export const sectorIndex = (round: number) => (Math.max(1, round) - 1) % 3;
export class Random {
  constructor(public seed: number) {}
  next() { let x = this.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
}
/** Authored, mirrored motifs. Every row leaves an independent, wide escape lane. */
export function timeline(round: number, seed: number): Spawn[] {
  const rng = new Random(seed || 1);
  const mirror = round > 1 && rng.next() > 0.5;
  const out: Spawn[] = [];
  const sector = sectorIndex(round);
  const add = (at: number, kind: Spawn['kind'], x: number, stage?: number, pair?: boolean, pattern?: Spawn['pattern'], lane?: number) =>
    out.push({ at, kind, x: mirror ? 720 - x : x, stage, pair, pattern, lane: lane === undefined ? undefined : mirror ? 720 - lane : lane });
  // Eight authored motifs: introduction, crate, single gate, paired gate,
  // alternating wave, elite pressure, equipment choice, release wave.
  if (sector === 0) [1, 3.5, 5.5].forEach((t, i) => add(t, 'drone', [360, 210, 510][i]));
  else if (sector === 1) {
    add(1, 'drone', 200, undefined, undefined, 'weave');
    add(2.2, 'drone', 520, undefined, undefined, 'weave');
    add(4.5, 'charger', 140, undefined, undefined, 'flank', 480);
  } else {
    add(1, 'armor', 360, undefined, undefined, 'fan');
    add(4, 'drone', 360); add(5.5, 'drone', 360);
  }
  add(8, 'crate', 240, 2);
  add(16, 'armory', 360);
  add(15.5, 'drone', 500, undefined, undefined, sector === 1 ? 'weave' : undefined);
  add(17, 'drone', 360, undefined, undefined, sector === 1 ? 'weave' : undefined);
  add(20, 'gates', 360);
  add(27, 'gates', 360, undefined, true);
  if (sector === 0) for (let t = 34; t < 42; t += 1.4) {
    add(t, 'drone', [200, 360, 520][Math.floor(rng.next() * 3)]);
    add(t + 0.35, 'drone', [240, 480][Math.floor(rng.next() * 2)]);
  }
  if (sector === 0) { add(38, 'armor', 190); add(42, 'elite', 500); }
  else if (sector === 1) {
    for (const [time, x, lane] of [[31, 140, 480], [37, 580, 240], [43, 140, 480]]) add(time, 'charger', x, undefined, undefined, 'flank', lane);
    for (let t = 33; t < 42; t += 2) { add(t, 'drone', 230, undefined, undefined, 'weave'); add(t + .5, 'drone', 490, undefined, undefined, 'weave'); }
    add(32, 'sniper', 500); add(38, 'armor', 500); add(45, 'elite', 360, undefined, undefined, 'fan');
  } else {
    add(31, 'sniper', 180); add(35, 'armor', 540, undefined, undefined, 'fan');
    add(40, 'elite', 360, undefined, undefined, 'fan');
    for (let t = 33; t < 43; t += 2.5) for (const x of [180, 540]) add(t, 'drone', x, undefined, undefined, 'weave');
  }
  add(48, 'armory', 360, 3); add(49.2, 'gates', 500);
  add(58, 'gates', 360, undefined, true);
  if (sector === 0) for (let t = 62; t < 68; t += 1.2) {
    for (const x of [200, 360, 520]) add(t + Math.abs(360 - x) / 800, 'drone', x);
  }
  else if (sector === 1) for (let t = 61; t < 68; t += 1.5) { add(t, 'drone', 200, undefined, undefined, 'weave'); add(t + .4, 'drone', 520, undefined, undefined, 'weave'); }
  else { add(60, 'armor', 360, undefined, undefined, 'fan'); for (const t of [62, 64, 66]) for (const x of [200, 520]) add(t, 'drone', x, undefined, undefined, 'weave'); }
  if (round > 1 && sector === 0) { add(13, 'charger', 500); add(32, 'charger', 200); add(55, 'armor', 500); }
  return out.sort((a, b) => a.at - b.at);
}
