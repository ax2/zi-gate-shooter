import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import type {OpticalBranch} from '../src/core/build-tree';
function fixture(branch:OpticalBranch){const w=new World();w.growth.mastery=2;w.chooseBuild('optical');w.chooseBuild('optical',branch);return w;}
function target(w:World,x=360,y=600,kind:'armor'|'guard'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function frames(w:World,n=1){let events:ReturnType<World['drainEffects']>=[];for(let i=0;i<n;i++){w.bullets=[];w.step(C.step,360);events.push(...w.drainEffects());}return events;}
it('spends one point for an immutable branch and preserves laser damage, cooldown, weapons and prism progression',()=>{
 for(const branch of ['burn','relay'] as const){
  const w=new World();w.growth.mastery=4;w.chooseBuild('optical');const damage=w.supportProfile().laserDamage;
  const weapons=[...w.activeWeapons];expect(w.chooseBuild('optical',branch)).toBe(true);
  expect(w.build.spent).toBe(2);expect(w.build.opticalBranch).toBe(branch);expect(w.supportProfile().laserDamage).toBe(damage);
  expect(w.supportProfile().laserInterval).toBe(2.25);expect(w.activeWeapons).toEqual(weapons);
  expect(w.chooseBuild('optical',branch==='burn'?'relay':'burn')).toBe(false);expect(w.build.spent).toBe(2);
  w.chooseBuild('optical');w.chooseBuild('ballistic');expect(w.supportProfile().prism).toBe(true);expect(w.build.opticalBranch).toBe(branch);
 }
});
it('burn contributes three exact delayed hits to the first surviving enemy and no splash or recursive rewards',()=>{
 const w=fixture('burn'),a=target(w),near=target(w,450),gate=w.spawn('gate',500,650),crate=w.spawn('crate',440,650);
 const damage=w.supportProfile().laserDamage*1.2;frames(w);
 expect(a.hp).toBeCloseTo(1000-damage);expect(a.burnTicks).toBe(3);expect(near.hp).toBe(1000);
 frames(w,17);expect(w.burnHits).toBe(0);frames(w);expect(w.burnHits).toBe(1);
 frames(w,36);expect(w.burnHits).toBe(3);expect(a.hp).toBeCloseTo(1000-damage*1.75);
 expect(near.hp).toBe(1000);expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);expect(w.fractureBursts).toBe(0);
 frames(w,18);expect(w.burnHits).toBe(3);
});
it('relay damages the nearest neighbor once even if direct laser kills its source, and does not recurse',()=>{
 const w=fixture('relay'),a=target(w),b=target(w,460),c=target(w,550);a.hp=5;
 const events=frames(w),damage=w.supportProfile().laserDamage*1.2;
 expect(a.active).toBe(false);expect(b.hp).toBeCloseTo(1000-damage*.65);expect(c.hp).toBe(1000);
 expect(w.relayHits).toBe(1);expect(w.burnHits).toBe(0);expect(events.filter(e=>e.type==='refract')).toHaveLength(1);
});
it.each(['burn'] as const)('%s cannot start through a closed shield or reward blocker',branch=>{
 for(const kind of ['guard','crate','gate'] as const){
  const w=fixture(branch),a=w.spawn(kind,360,700),behind=target(w,360,500),near=target(w,460,700);a.speed=0;a.timer=999;
  frames(w,55);expect(behind.hp).toBe(1000);expect(near.hp).toBe(1000);expect(w.burnHits).toBe(0);expect(w.relayHits).toBe(0);
 }
});
it('burn cannot damage off-strip enemies or progress during a transition and stops on death',()=>{
 const w=fixture('burn'),a=target(w);frames(w);a.y=200;frames(w,30);expect(w.burnHits).toBe(0);
 a.y=600;w.phase='recovery';frames(w,30);expect(w.burnHits).toBe(0);
 w.player.x=68;w.phase='running';a.hp=1;frames(w,60);expect(w.burnHits).toBe(1);expect(a.active).toBe(false);
 expect(new World().build.opticalBranch).toBeUndefined();expect(new World().burnHits).toBe(0);
});
it('split beam ignores off-strip and distant targets while shield mitigation and non-contact rewards are preserved',()=>{
 const w=fixture('relay');target(w,360,275);const shield=target(w,460,275,'guard'),hidden=target(w,360,200),far=target(w,600,275);
 const gate=w.spawn('gate',100,330),crate=w.spawn('crate',140,330);gate.speed=crate.speed=0;
 frames(w);const damage=w.supportProfile().laserDamage*1.2;
 expect(shield.hp).toBeCloseTo(1000-damage*.65*.5);expect(hidden.hp).toBe(1000);expect(far.hp).toBe(1000);
 expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);
});

it.each(['guard','crate','gate'] as const)('split ray stops at the first %s collider without reaching the intended target',kind=>{
 const w=fixture('relay'),blocker=w.spawn(kind,430,700),behind=target(w,480,500);blocker.speed=0;blocker.timer=999;
 const hp=blocker.hp;frames(w);expect(behind.hp).toBe(1000);expect(w.relayHits).toBe(1);
 if(kind==='gate')expect(blocker.energy).toBeCloseTo(w.supportProfile().laserDamage*1.2*1.65);
 else expect(blocker.hp).toBeLessThan(hp);
 expect(w.fractureBursts).toBe(0);expect(w.burnHits).toBe(0);
});
