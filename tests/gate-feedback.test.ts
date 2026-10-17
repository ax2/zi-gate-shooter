import { expect, it } from 'vitest';
import { GateFeedback, GATE_RECEIPT, gateReceiptReadable, gateReceiptBounds } from '../src/game/gate-feedback';
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
  const before = structuredClone(f.receipts); f.advance(0,()=>false); expect(f.receipts).toEqual(before);
  f.advance(GATE_RECEIPT.lifetime,()=>false); expect(f.receipts).toHaveLength(0); f.claim(360, 1024, '储能已满'); f.clear(); expect(f.receipts).toHaveLength(0);
});

it('budgets visible reading separately from waiting and keeps only one visible receipt',()=>{
 const f=new GateFeedback();f.claim(360,1024,'火力 +5%');f.claim(360,1024,'充能 +25');
 f.advance(1,()=>false);expect(f.receipts.map(r=>r.age)).toEqual([0,0]);
 f.advance(.5);expect(f.receipts.map(r=>r.visible)).toEqual([true,false]);expect(f.receipts.map(r=>r.age)).toEqual([.5,0]);
 const before=structuredClone(f.receipts);f.advance(0,()=>false);expect(f.receipts.map(r=>[r.age,r.elapsed])).toEqual(before.map(r=>[r.age,r.elapsed]));
 f.advance(.5);expect(f.receipts[0].age).toBe(1);f.advance(.41);expect(f.receipts).toHaveLength(1);expect(f.receipts[0].age).toBe(0);
 f.advance(.3);expect(f.receipts[0].age).toBe(.3);f.advance(6,()=>false);expect(f.receipts).toHaveLength(0);
});
it('avoids actual bodies, labels and hostile projectiles without changing combat',()=>{
 const w=new World(),f=new GateFeedback();f.claim(360,1024,'火力 +5% · 充能 +25');const r=f.receipts[0],box=gateReceiptBounds(r);
 expect(gateReceiptReadable(r,[],[])).toBe(true);expect(gateReceiptReadable(r,[],[],{top:box.top,bottom:box.bottom})).toBe(false);
 const b=w.spawn('drone',360,box.y),before=JSON.stringify(w);expect(gateReceiptReadable(r,w.bodies,[])).toBe(false);expect(JSON.stringify(w)).toBe(before);
 b.x=68;expect(gateReceiptReadable(r,w.bodies,[])).toBe(true);b.x=360;b.y=box.bottom+100;expect(gateReceiptReadable(r,w.bodies,[])).toBe(false);
 b.active=false;const boss=w.spawn('boss',360,box.y);expect(gateReceiptReadable(r,w.bodies,[])).toBe(false);boss.active=false;
 const bullet={active:true,hostile:true,x:box.right+13,y:box.y} as any;expect(gateReceiptReadable(r,[],[bullet])).toBe(false);bullet.hostile=false;expect(gateReceiptReadable(r,[],[bullet])).toBe(true);
});
