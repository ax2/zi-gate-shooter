import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

it.each(['crate','gate'] as const)('laser unlocks at the third breakthrough and is absorbed by the first %s', kind => {
  const w=new World();w.growth.mastery=3;
  const box=w.spawn(kind,360,700,3);box.speed=0;
  const behind=w.spawn('armor',360,400);behind.speed=0;
  w.step(C.step);
  if(kind==='crate')expect(box.hp).toBe(112-39);else expect(box.energy).toBe(39);
  expect(behind.hp).toBe(80);
  expect(w.drainEffects().filter(e=>e.type==='laser')).toHaveLength(1);
  for(let i=0;i<10;i++){w.step(C.step);expect(w.drainEffects().filter(e=>e.type==='laser')).toHaveLength(0);}
});

it('laser has a four-target ceiling and closed guards block enemies behind them', () => {
  const w=new World();w.growth.mastery=3;
  const targets=[800,690,580,470,360].map(y=>w.spawn('armor',360,y));
  w.step(C.step);
  expect(targets.map(t=>t.hp)).toEqual([41,41,41,41,80]);
  const s=new World();s.growth.mastery=3;
  const shield=s.spawn('guard',360,500),behind=s.spawn('armor',360,300);
  s.step(C.step);expect(shield.hp).toBe(64-19.5);expect(behind.hp).toBe(80);
});

it('refraction adds one nearby hit without farming crates or recursively reflecting', () => {
  const w=new World();w.growth.mastery=5;w.phase='boss-entry';
  const first=w.spawn('armor',360,500),next=w.spawn('armor',460,500),third=w.spawn('armor',550,500);
  const crate=w.spawn('crate',380,520);
  w.bullets.push({id:999,x:360,y:500,px:360,py:500,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'pulse'});
  w.step(C.step);
  expect(first.hp).toBe(70);expect(next.hp).toBe(74);expect(third.hp).toBe(80);expect(crate.hp).toBe(crate.maxHp);
  expect(w.drainEffects().filter(e=>e.type==='refract')).toHaveLength(1);
});

it('rapid laser evolution increases actual firing cadence without adding projectile objects', () => {
  const counts=[7,8].map(mastery=>{
    const w=new World();w.growth.mastery=mastery;w.phase='boss';
    let count=0;
    for(let i=0;i<360;i++){w.step(C.step);count+=w.drainEffects().filter(e=>e.type==='laser').length;}
    return count;
  });
  expect(counts).toEqual([2,4]);
});

it('double refraction hits two distinct nearby enemies, never a reward or third enemy', () => {
  const w=new World();w.growth.mastery=12;w.phase='boss-entry';
  const first=w.spawn('armor',360,500),left=w.spawn('armor',260,500),right=w.spawn('armor',460,500),far=w.spawn('armor',520,500);
  const crate=w.spawn('crate',380,520);
  w.bullets.push({id:999,x:360,y:500,px:360,py:500,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'pulse'});
  w.step(C.step);
  expect([first.hp,left.hp,right.hp,far.hp]).toEqual([70,74,74,80]);
  expect(crate.hp).toBe(crate.maxHp);
  expect(w.drainEffects().filter(e=>e.type==='refract')).toHaveLength(2);
});
it('prism combination retains main beam and adds two weaker independent lanes',()=>{
 const w=new World();w.growth.mastery=4;
 for(const route of ['optical','optical','optical','ballistic'] as const)expect(w.chooseBuild(route)).toBe(true);
 const targets=[248,360,472].map(x=>{const b=w.spawn('armor',x,575);b.speed=0;return b;});
 w.step(C.step);
 const full=30*1.15*1.4;
 expect(targets[1].hp).toBeCloseTo(80-full);
 expect(targets[0].hp).toBeCloseTo(80-full*.45);
 expect(targets[2].hp).toBeCloseTo(80-full*.45);
 expect(w.drainEffects().filter(e=>e.type==='laser')).toHaveLength(3);
 expect(new World().supportProfile().prism).toBe(false);
});
