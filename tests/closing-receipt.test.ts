import{it,expect}from'vitest';import{createRenderFixture}from'./helpers/render-fixture';import{closingAssault}from'../src/core/closing-assault';
let id=990000;
it.each([false,true])('actual all-clear reward remains readable through its earned upgrade choice, then shows the upgrade receipt (weak=%s)',async weak=>{
 const f=createRenderFixture(weak);await f.runtime.load();f.runtime.start();const w=f.runtime.world;Object.assign(w,{scheduled:closingAssault(1,false),secondChance:true,shoot(){}});w.roundTime=67.99;w.player.x=w.player.px=652;w.growth.energy=80;
 for(let i=0;i<29;i++)f.tick();expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('终线全歼 0/4'))).toBe(true);
 const targets=w.bodies.filter(b=>b.active);
 for(const [i,b]of targets.entries()){w.bullets.push({id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:100000,active:true,hostile:false,age:0});f.tick();if(i===0)expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('终线全歼 1/4'))).toBe(true);}
 expect(w.closingClears).toBe(1);expect(w.growth.energy).toBe(20);expect(f.runtime.mode).toBe('choice');expect(f.runtime.activateControl('build:optical')).toBe(true);expect(w.supportProfile().laserUnlocked).toBe(true);
 expect(f.calls.some(c=>c.kind==='fillText'&&String(c.args[0]).startsWith('终线全歼 4/4 · 充能+40'))).toBe(true);
 let sawUpgrade=false;for(let i=0;i<300&&!sawUpgrade;i++){f.tick();sawUpgrade=f.calls.some(c=>c.kind==='fillText'&&c.args[0]==='配件强化 · 聚焦镜组');}expect(sawUpgrade).toBe(true);expect(w.closingClears).toBe(1);
});
