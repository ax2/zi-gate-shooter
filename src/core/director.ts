import type { EnemyKind } from './config';
export interface Spawn { at: number; kind: EnemyKind | 'crate' | 'gates'; x: number; stage?: number; pair?: boolean }
export class Random {
  constructor(public seed: number) {}
  next() { let x = this.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.seed = x >>> 0; return this.seed / 4294967296; }
}
/** Authored, mirrored motifs. Every row leaves an independent, wide escape lane. */
export function timeline(round: number, seed: number): Spawn[] {
  const rng = new Random(seed || 1);
  const mirror = round > 1 && rng.next() > 0.5;
  const out: Spawn[] = [];
  const add = (at: number, kind: Spawn['kind'], x: number, stage?: number, pair?: boolean) =>
    out.push({ at, kind, x: mirror ? 720 - x : x, stage, pair });
  // Eight authored motifs: introduction, crate, single gate, paired gate,
  // alternating wave, elite pressure, equipment choice, release wave.
  [1, 3.5, 5.5].forEach((t, i) => add(t, 'drone', [360, 210, 510][i]));
  add(8, 'crate', 240, 2);
  add(15.5, 'drone', 500); add(17, 'drone', 360);
  add(20, 'gates', 360);
  add(27, 'gates', 360, undefined, true);
  for (let t = 34; t < 42; t += 1.4) {
    add(t, 'drone', [200, 360, 520][Math.floor(rng.next() * 3)]);
    add(t + 0.35, 'drone', [240, 480][Math.floor(rng.next() * 2)]);
  }
  add(38, 'armor', 190); add(42, 'elite', 500);
  add(48, 'crate', 240, 3); add(49.2, 'gates', 500);
  add(58, 'gates', 360, undefined, true);
  for (let t = 62; t < 68; t += 1.2) {
    for (const x of [200, 360, 520]) add(t + Math.abs(360 - x) / 800, 'drone', x);
  }
  if (round > 1) { add(13, 'charger', 500); add(32, 'charger', 200); add(55, 'armor', 500); }
  return out.sort((a, b) => a.at - b.at);
}
