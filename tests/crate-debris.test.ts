import { expect, it } from 'vitest';
import { CrateDebris, crateFrame } from '../src/game/crate-debris';

it('reserves boss wreckage capacity, freezes at zero dt and retires finite-lived armor', () => {
  const d = new CrateDebris();
  for (let i = 0; i < 10; i++) { d.burst(i * 100, 600); expect(d.pieces.length).toBeLessThanOrEqual(9); }
  expect(d.pieces.slice(-6).map(p => p.frame)).toEqual([3, 4, 5, 6, 7, 8]);
  const frozen = structuredClone(d.pieces); d.advance(0); expect(d.pieces).toEqual(frozen);
  d.advance(0.25); expect(d.pieces).not.toEqual(frozen);
  d.advance(1); expect(d.pieces).toHaveLength(0);
  d.burst(360, 600); d.clear(); expect(d.pieces).toHaveLength(0);
});

it('uses the visual 75/35 percent thresholds for both T2 and T3 crate durability', () => {
  for (const hp of [48, 112]) {
    expect(crateFrame(hp, hp)).toBe(0); expect(crateFrame(hp * 0.75, hp)).toBe(1);
    expect(crateFrame(hp * 0.35, hp)).toBe(2); expect(crateFrame(1, hp)).toBe(2);
  }
});
