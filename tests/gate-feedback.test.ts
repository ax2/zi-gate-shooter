import { expect, it } from 'vitest';
import { GateFeedback } from '../src/game/gate-feedback';
import { World } from '../src/core/world';
import { gateRewardLabel } from '../src/core/rewards';

it('shows both actual rewards and distinguishes charging from an already active overload', () => {
  expect(gateRewardLabel({ power: 5, energy: 25 })).toBe('火力 +5% · 充能 +25');
  expect(gateRewardLabel({ power: 30, energy: 0 })).toBe('火力 +30%');
  expect(gateRewardLabel({ power: 0, energy: 20 })).toBe('充能 +20');
  expect(gateRewardLabel({ power: 0, energy: 0 })).toBe('储能已满');
});

it('coalesces skipped tiers, expires by simulation time and releases removed gate IDs', () => {
  const w = new World(), g = w.spawn('gate', 360, 400), f = new GateFeedback();
  f.sync(w.bodies, 1); expect(f.pulse(g.id, 1)).toBe(0);
  g.energy = 144; f.sync(w.bodies, 2); expect(f.pulse(g.id, 2)).toBe(1);
  f.sync(w.bodies, 2.06); expect(f.pulse(g.id, 2.06)).toBeCloseTo(0.5);
  f.sync(w.bodies, 2.06); expect(f.pulse(g.id, 2.06)).toBeCloseTo(0.5);
  f.sync(w.bodies, 2.2); expect(f.pulse(g.id, 2.2)).toBe(0);
  f.sync([], 2.21); g.energy = 0; f.sync(w.bodies, 2.22); expect(f.pulse(g.id, 2.22)).toBe(0);
  for (let i = 0; i < 8; i++) f.claim(360, 1024, '火力 +5% · 充能 +25');
  expect(f.receipts).toHaveLength(2); expect(f.receipts[0].lines).toEqual(['火力 +5%', '充能 +25']);
  const before = structuredClone(f.receipts); f.advance(0); expect(f.receipts).toEqual(before);
  f.advance(0.8); expect(f.receipts).toHaveLength(0); f.claim(360, 1024, '储能已满'); f.clear(); expect(f.receipts).toHaveLength(0);
});
