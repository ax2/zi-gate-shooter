import {expect,it} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import type {WeaponKind} from '../src/core/weapons';
function equip(w:World,kind:WeaponKind,stage=2){const p=w.spawn('pickup',w.player.x,C.playerY,stage);p.weaponKind=kind;w.step(C.step,w.player.x);}
function setup(){const w=new World();equip(w,'pierce');equip(w,'blast');w.bullets=[];w.drainEffects();return w;}
function enemy(w:World,x=360,y=500,kind:'armor'|'guard'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
let id=100000;
function hit(w:World,b:Body,damage=10,kind:WeaponKind='pierce'){
 w.bullets=[];w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind});
 w.step(C.step,68);return w.drainEffects();
}
it('requires both T2 modules, preserves other firepower and announces an actual pickup unlock once',()=>{
 const w=new World();equip(w,'pierce',1);equip(w,'blast',1);expect(w.fractureUnlocked()).toBe(false);
 equip(w,'pierce');expect(w.fractureUnlocked()).toBe(false);w.drainEffects();equip(w,'blast');
 expect(w.fractureUnlocked()).toBe(true);expect(w.activeWeapons).toContain('pulse');expect(w.weaponStage('pulse')).toBe(1);
 expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(1);equip(w,'blast',3);
 expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(0);expect(w.fractureUnlocked()).toBe(true);
});
it('adds a third-hit detonation and one non-recursive splash while preserving direct hits and reward objects',()=>{
 const w=setup(),main=enemy(w),near=enemy(w,455),far=enemy(w,510),gate=w.spawn('gate',435,570),crate=w.spawn('crate',435,570);
 hit(w,main);expect(main.fractureHits).toBe(1);hit(w,main);expect(main.fractureHits).toBe(2);
 const events=hit(w,main);expect(main.hp).toBe(950);expect(main.fractureHits).toBe(0);
 expect(near.hp).toBe(992.5);expect(near.fractureHits??0).toBe(0);expect(far.hp).toBe(1000);
 expect(crate.hp).toBe(crate.maxHp);expect(gate.energy).toBe(0);expect(w.fractureBursts).toBe(1);
 expect(events.filter(e=>e.type==='fracture')).toHaveLength(1);
});
it('keeps marks per target, enforces cooldown and cannot count one stationary piercing shot repeatedly',()=>{
 const w=setup(),a=enemy(w),b=enemy(w,600);hit(w,a);hit(w,b);hit(w,a);hit(w,b);
 hit(w,a);expect(w.fractureBursts).toBe(1);expect(b.fractureHits).toBe(2);
 for(let i=0;i<6;i++)hit(w,a);expect(a.fractureHits).toBe(0);expect(w.fractureBursts).toBe(1);
 for(let i=0;i<24;i++){w.bullets=[];w.step(C.step,68);}w.bullets=[];
 w.bullets.push({id:id++,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:1,age:0,active:true,hostile:false,weaponKind:'pierce',remainingTargets:3,hitBodies:[]});
 for(let i=0;i<3;i++)w.step(C.step,68);expect(a.fractureHits).toBe(1);
 hit(w,b);expect(w.fractureBursts).toBe(2);
});
it('closed shields cannot accumulate marks; open shields and nearby shields use normal mitigation',()=>{
 const w=setup(),guard=enemy(w,360,500,'guard');for(let i=0;i<3;i++)hit(w,guard);
 expect(guard.fractureHits??0).toBe(0);expect(w.fractureBursts).toBe(0);expect(guard.hp).toBe(985);
 guard.burst=1;const nearby=enemy(w,455,500,'guard');for(let i=0;i<3;i++)hit(w,guard);
 expect(w.fractureBursts).toBe(1);expect(nearby.hp).toBe(996.25);
});
it('dead targets, reward contacts and other weapon families cannot generate detonation',()=>{
 const w=setup(),b=enemy(w);b.hp=25;hit(w,b);hit(w,b);hit(w,b);
 expect(b.active).toBe(false);expect(w.fractureBursts).toBe(0);
 const other=enemy(w,360,650);for(const kind of ['pulse','scatter','arc','blast'] as const)for(let i=0;i<3;i++)hit(w,other,1,kind);
 const gate=w.spawn('gate',360,550),crate=w.spawn('crate',360,550);
 for(let i=0;i<3;i++){hit(w,gate,1);hit(w,crate,1);}expect(w.fractureBursts).toBe(0);
 expect(gate.fractureHits??0).toBe(0);expect(crate.fractureHits??0).toBe(0);
});
it('does not splash across the active strip or into an entering boss and clears counts on a new run',()=>{
 const w=setup(),a=enemy(w,360,275),hidden=enemy(w,360,200);w.phase='boss-entry';w.phaseTime=1.9;
 const boss=w.spawn('boss',360,C.bossY);boss.hp=boss.maxHp=2000;
 for(let i=0;i<3;i++)hit(w,a);expect(w.fractureBursts).toBe(1);expect(hidden.hp).toBe(1000);expect(boss.hp).toBe(2000);
 expect(new World().fractureBursts).toBe(0);expect(new World().fractureUnlocked()).toBe(false);
});
