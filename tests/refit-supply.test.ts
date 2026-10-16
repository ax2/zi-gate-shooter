import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {armoryChoices,armoryOffers,refitFocus} from '../src/core/armory-offers';
import {refitLabel} from '../src/game/refit-label';
import type {WeaponKind} from '../src/core/weapons';
const kinds:WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
it('preserves early discovery and offers distinct expansion/refit choices for every later arsenal',()=>{
 for(let mask=1;mask<32;mask++){
  const owned=kinds.filter((_,i)=>mask&(1<<i));
  expect(armoryChoices(owned,['blast','arc']).map(o=>o.kind)).toEqual(armoryOffers(owned,['blast','arc']));
  const offers=armoryChoices(owned,['blast','arc'],owned[0]);expect(new Set(offers.map(o=>o.kind)).size).toBe(2);
  if(owned.length<2)expect(offers.every(o=>!o.refit)).toBe(true);
  else if(owned.length<5){expect(owned).not.toContain(offers[0].kind);expect(offers[1]).toEqual({kind:owned[0],refit:true});}
  else expect(offers.every(o=>o.refit&&owned.includes(o.kind))).toBe(true);
 }
 expect(refitFocus(['pulse','scatter','arc'],'pulse',{ballistic:2,electric:1})).toBe('scatter');
 expect(refitFocus(['pulse','scatter','arc'],'arc',{ballistic:1,electric:1})).toBe('arc');
});
it('actual chapter supply offers a focused refit without modifying the first chapter',()=>{
 for(const round of [1,2]){
  const w=new World(1337,round);w.growth.mastery=1;w.chooseBuild('ballistic');w.roundTime=15.99;
  Object.assign(w,{scheduled:[{at:16,kind:'armory',x:360}]});w.step(C.step,68);
  const boxes=w.bodies.filter(b=>b.kind==='crate'&&b.weaponKind);expect(boxes).toHaveLength(2);
  expect(boxes.filter(b=>b.refit)).toHaveLength(round===1?0:1);
  if(round===2){expect(boxes[1].weaponKind).toBe('scatter');expect(boxes[1].stage).toBe(2);expect(boxes[0].weaponKind).toBe('blast');}
 }
});
it('breaking creates a refit drop, pickup alone upgrades once and cancels the other reward',()=>{
 const w=new World();w.phase='boss';w.growth.stage=3;w.growth.mastery=1;w.growth.energy=25;w.chooseBuild('ballistic');
 const before=w.activeWeapons,box=w.spawn('crate',360,800,2);box.weaponKind='scatter';box.refit=true;box.row=42;box.speed=0;box.hp=1;
 const other=w.spawn('crate',500,800,3);other.weaponKind='arc';other.row=42;
 w.bullets.push({id:99999,x:360,y:820,px:360,py:820,vx:0,vy:-1200,damage:10,age:0,active:true,hostile:false});
 w.step(C.step,360);w.drainEffects();expect(w.weaponStage('scatter')).toBe(1);expect(w.refitsClaimed).toBe(0);
 const drop=w.bodies.find(b=>b.kind==='pickup')!;expect(drop.refit).toBe(true);expect(refitLabel(w,'scatter')).toBe('T1 → T2');
 drop.y=drop.py=C.playerY;drop.speed=0;w.step(C.step,360);const events=w.drainEffects();
 expect(w.refitsClaimed).toBe(1);expect(w.weaponStage('scatter')).toBe(2);expect(w.weaponStage('pulse')).toBe(3);
 expect(w.growth.stage).toBe(3);expect(w.growth.energy).toBe(25);expect(w.activeWeapons).toEqual(before);
 expect(w.bodies.some(b=>b.row===42)).toBe(false);expect(events.filter(e=>e.type==='upgrade')).toHaveLength(1);
 w.step(C.step,360);expect(w.refitsClaimed).toBe(1);
});
it('uses live T3 state for late pickup, calibrates only that weapon and leaves normal duplicates charging',()=>{
 const w=new World();w.phase='boss';w.weaponKind='scatter';w.growth.stage=3;w.growth.mastery=1;w.growth.energy=20;w.chooseBuild('electric');
 const before=w.profileFor('scatter').damage,arc=w.profileFor('arc'),owned=w.activeWeapons;
 const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='scatter';p.refit=true;p.speed=0;
 expect(refitLabel(w,'scatter')).toBe('单轮直伤 31.9 → 47.9');w.step(C.step,360);w.drainEffects();
 expect(w.weaponCalibration('scatter')).toBe(1);expect(w.weaponStage('scatter')).toBe(3);expect(w.growth.energy).toBe(20);
 expect(w.profileFor('scatter').damage).toEqual(before.map(n=>n*1.5));expect(w.profileFor('arc')).toEqual(arc);expect(w.activeWeapons).toEqual(owned);
 const ordinary=w.spawn('pickup',360,C.playerY,3);ordinary.weaponKind='scatter';ordinary.speed=0;w.step(C.step,360);
 expect(w.growth.energy).toBe(50);expect(w.weaponCalibration('scatter')).toBe(1);expect(w.refitsClaimed).toBe(1);
});
it('keeps specialist contracts valid when a refit increases power without adding a weapon kind',()=>{
 const w=new World(1337,2);w.growth.mastery=1;w.chooseBuild('ballistic');expect(w.acceptContract('specialist')).toBe(true);
 const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='scatter';p.refit=true;p.speed=0;w.step(C.step,360);
 expect(w.contract?.status).toBe('active');expect(w.activeWeapons).toHaveLength(2);expect(w.weaponStage('scatter')).toBe(2);
});
it('can complete an existing equipment combination through a real refit pickup',()=>{
 const w=new World();w.phase='boss';w.weaponKind='pierce';
 const blast=w.spawn('pickup',360,C.playerY,2);blast.weaponKind='blast';blast.speed=0;w.step(C.step,360);w.drainEffects();
 expect(w.fractureUnlocked()).toBe(false);expect(w.weaponStage('pierce')).toBe(1);
 const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='pierce';p.refit=true;p.speed=0;w.step(C.step,360);
 expect(w.fractureUnlocked()).toBe(true);expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(1);
});
