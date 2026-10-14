import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';

function shell(w:World,x:number,y:number){w.bullets.push({id:9999,x,y,px:x,py:y,vx:0,vy:0,damage:20,age:0,active:true,hostile:false,weaponKind:'blast',splashRadius:110});}
it('damages each adjacent enemy once, respects shields and leaves rewards untouched',()=>{
 const w=new World();const primary=w.spawn('armor',360,500),near=w.spawn('armor',430,500),shield=w.spawn('guard',300,500);
 const far=w.spawn('armor',520,500),crate=w.spawn('crate',420,540),gate=w.spawn('gate',290,540);
 const initial=[crate.hp,gate.energy];shell(w,360,500);w.step(C.step,68);
 expect(primary.hp).toBe(60);expect(near.hp).toBe(70);expect(shield.hp).toBe(59);expect(far.hp).toBe(80);
 expect([crate.hp,gate.energy]).toEqual(initial);
 expect(w.drainEffects().filter(e=>e.type==='blast')).toHaveLength(1);
});
it.each(['crate','gate'] as const)('a direct %s contact absorbs the shell without an explosion',kind=>{
 const w=new World();w.spawn(kind,360,500);const enemy=w.spawn('armor',430,500);
 shell(w,360,500);w.step(C.step,68);expect(enemy.hp).toBe(80);
 expect(w.drainEffects().some(e=>e.type==='blast')).toBe(false);
});
it('snapshots blast radius at fire time and does not damage off-screen enemies',()=>{
 const w=new World();w.weaponKind='blast';w.growth.stage=3;w.step(C.step,360);
 const shot=w.bullets.find(b=>!b.hostile)!;expect(shot.splashRadius).toBe(130);
 w.weaponKind='pulse';w.growth.stage=1;expect(shot.splashRadius).toBe(130);
 const primary=w.spawn('armor',360,280),hidden=w.spawn('armor',360,190);primary.speed=hidden.speed=0;
 w.bullets=[];shell(w,360,280);w.step(C.step,68);expect(hidden.hp).toBe(80);
});
