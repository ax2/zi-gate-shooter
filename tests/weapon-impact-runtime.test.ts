import {it,expect} from 'vitest';
import {CanvasRuntime} from '../src/game/canvas-runtime';
import {defaults} from '../src/ui/storage';
import {C} from '../src/core/config';
import type {WeaponKind} from '../src/core/weapons';
const kinds:WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
async function setup(){
 let clock=1000,next=(_t:number)=>{};
 const ctx=new Proxy({}, {get(_t,key){if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop(){}});return ()=>{};},set(){return true;}}) as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,width:390,height:844,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame:f=>{next=f;}});await r.load();r.start();Object.assign(r.world,{scheduled:[]});r.world.phase='recovery';
 for(const kind of kinds){const b=r.world.spawn('pickup',360,C.playerY,2);b.weaponKind=kind;}
 const tick=()=>{clock+=1000/60;next(clock);};tick();expect(r.mode).toBe('choice');expect(r.activateControl('build:optical')).toBe(true);r.world.phase='boss';
 return {r,tick};
}
it('five real same-point damage contacts keep all weapon families alongside the actual optical impact, then pause and restart cleanly',async()=>{
 const {r,tick}=await setup(),body=r.world.spawn('armor',360,600);body.speed=0;body.timer=999;body.hp=body.maxHp=1000;
 for(const [i,kind] of kinds.entries())r.world.bullets.push({id:99000+i,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:1,age:0,active:true,hostile:false,weaponKind:kind,chainHops:0});
 tick();expect(body.hp).toBeLessThanOrEqual(995);expect(r.world.hits).toBeGreaterThanOrEqual(5);
 const d=r.diagnostics();expect(new Set(d.weaponImpacts.map(h=>h.kind))).toEqual(new Set(kinds));expect(d.opticalImpacts).toBeGreaterThan(0);expect(d.weaponImpacts.length+d.opticalImpacts).toBeLessThanOrEqual(12);expect(d.weaponImpacts.every(h=>h.total===.18&&h.life>0)).toBe(true);
 const before=JSON.stringify(d.weaponImpacts),time=r.world.time;r.pause();for(let i=0;i<120;i++)tick();expect(r.world.time).toBe(time);expect(JSON.stringify(r.diagnostics().weaponImpacts)).toBe(before);
 r.start();expect(r.diagnostics().weaponImpacts).toHaveLength(0);
});
it('entry-protected damage contacts do not invent metal cracks or weapon impacts',async()=>{
 const {r,tick}=await setup(),body=r.world.spawn('armor',360,600);body.speed=0;body.timer=999;body.hp=body.maxHp=1000;body.dropGrace=1;
 for(const [i,kind] of kinds.entries())r.world.bullets.push({id:99000+i,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:1,age:0,active:true,hostile:false,weaponKind:kind,chainHops:0});
 tick();expect(body.hp).toBe(1000);expect(r.diagnostics().weaponImpacts).toHaveLength(0);expect(r.diagnostics().opticalImpacts).toBe(0);
});
