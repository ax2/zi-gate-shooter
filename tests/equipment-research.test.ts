import {expect,it} from 'vitest';
import {World} from '../src/core/world';import {C} from '../src/core/config';
function pickup(w:World,row=0,kind:'pulse'|'scatter'|'arc'='pulse'){const b=w.spawn('pickup',w.player.x,C.playerY,2);b.weaponKind=kind;b.row=row;w.step(C.step,w.player.x);return w.drainEffects();}
it('grants no research on crate damage or break; only its eventual real pickup earns the first point',()=>{
 const w=new World(),b=w.spawn('crate',360,600,2);b.hp=1;b.speed=0;w.bullets=[{id:99999,x:360,y:600,px:360,py:600,vx:0,vy:0,age:0,damage:2,active:true,hostile:false}];w.step(C.step,360);expect(w.cratesBroken).toBe(1);expect(w.researchPoints).toBe(0);expect(w.buildPoints).toBe(0);
 const drop=w.bodies.find(b=>b.kind==='pickup')!;drop.y=drop.py=C.playerY;w.step(C.step,360);expect(w.researchPoints).toBe(1);expect(w.buildPoints).toBe(1);expect(w.growth.energy).toBe(0);expect(w.growth.mastery??0).toBe(0);expect(w.growth.overload).toBe(0);
});
it('an initial exclusive pickup can earn both source points once and cancels the alternative',()=>{
 const w=new World(),a=w.spawn('pickup',360,C.playerY,2),b=w.spawn('pickup',360,C.playerY,2);a.row=b.row=7;a.weaponKind='scatter';b.weaponKind='arc';w.step(C.step,360);
 expect(w.pickups).toBe(1);expect(w.researchPoints).toBe(2);expect(w.activeWeapons).toContain('scatter');expect(w.activeWeapons).not.toContain('arc');expect(w.drainEffects().filter(e=>e.type==='research').map(e=>e.text)).toEqual(['装备研发 +2点']);
 pickup(w,8,'arc');expect(w.researchPoints).toBe(2);w.round=4;pickup(w,9);expect(w.researchPoints).toBe(2);expect(new World().researchPoints).toBe(0);
});
it('research and charge points add without changing breakthrough damage, milestones or overflow',()=>{
 const w=new World();pickup(w);pickup(w,9,'scatter');expect(w.buildPoints).toBe(2);expect(w.supportProfile().laserUnlocked).toBe(false);
 expect(w.chooseBuild('electric')).toBe(true);expect(w.chooseBuild('electric','capacitor')).toBe(true);expect(w.chooseBuild('optical')).toBe(false);expect(w.growth.mastery??0).toBe(0);
 w.growth.energy=100;w.step(C.step,360);expect(w.growth.mastery).toBe(1);expect(w.buildPoints).toBe(3);expect(w.growth.energy).toBe(0);expect(w.supportProfile().laserUnlocked).toBe(false);expect(w.chooseBuild('electric')).toBe(true);expect(w.build.spent).toBe(3);
});
it('a later duplicate keeps its original 30 charge and never farms more research',()=>{
 const w=new World();pickup(w);const events=pickup(w);expect(w.researchPoints).toBe(1);expect(w.growth.energy).toBe(30);expect(events.some(e=>e.type==='research')).toBe(false);
});
it('same-step death prevents pickup and its research, and an escaped drop earns nothing',()=>{
 const w=new World();w.player.hp=1;w.spawn('pickup',360,C.playerY,2);w.bullets=[{id:99999,x:360,y:C.playerY,px:360,py:C.playerY,vx:0,vy:0,age:0,damage:1,active:true,hostile:true}];w.step(C.step,360);expect(w.player.hp).toBe(0);expect(w.researchPoints).toBe(0);expect(w.pickups).toBe(0);
 const missed=new World();missed.spawn('pickup',360,1400,2);missed.step(C.step,360);expect(missed.researchPoints).toBe(0);
});
