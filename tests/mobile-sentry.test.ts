import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {advanceBody} from '../src/core/behavior';
import {sentryDirection} from '../src/core/mobile-sentry';
import {timeline} from '../src/core/director';
import {dangerTimeline} from '../src/core/reachability';
it('replaces exactly one existing later-chapter sentry while preserving rewards and the first chapter',()=>{
 expect(timeline(1,1337).some(s=>s.pattern==='relocate')).toBe(false);
 for(let round=2;round<=16;round++)for(const seed of [1,77,1337]){
  const all=timeline(round,seed),mobile=all.filter(s=>s.pattern==='relocate');
  expect(mobile).toHaveLength(1);expect(mobile[0].kind).toBe('sniper');expect(mobile[0].drop).toBe(true);
  expect(all.filter(s=>s.kind==='armory')).toHaveLength(2);expect(all.filter(s=>s.kind==='gates')).toHaveLength(4);
 }
});
it('deploys inward, then fires from a stationary lane and relocates between charges',()=>{
 for(const x of [220,500]){
  const w=new World(),b=w.spawn('sniper',x,360);b.pattern='relocate';const shots:number[]=[],visited:number[]=[x];
  for(let i=0;i<600;i++){
   const before=b.x,charging=b.warning>0;
   advanceBody(b,C.step,'running',0,px=>shots.push(px));
   if(charging)expect(b.x).toBeCloseTo(before);
   visited.push(b.x);
  }
  const destination=x+(x>=360?-140:140);
  expect(shots).toHaveLength(6);expect(shots.slice(0,3)).toEqual([destination,destination,destination]);
  expect(shots.slice(3)).toEqual([x,x,x]);
  expect(Math.max(...visited)-Math.min(...visited)).toBeCloseTo(140);expect(b.x).toBeCloseTo(destination);
  advanceBody(b,C.step,'running',0,()=>{});expect(b.y).toBeGreaterThan(360);expect(sentryDirection(b)).toBe(0);
 }
});
it('keeps ordinary sentries stationary and EMP cancels charge without removing movement or emitted bullets',()=>{
 const w=new World(),b=w.spawn('sniper',220,360);b.pattern='relocate';
 b.x=360;b.sentryVolleys=1;b.timer=2.4;b.empRemaining=1.5;const before=b.x;
 advanceBody(b,C.step,'running',0,()=>{throw new Error('offline fired');});
 expect(b.x).toBeLessThan(before);expect(b.timer).toBe(2.4);
 const ordinary=w.spawn('sniper',500,360);for(let i=0;i<590;i++)advanceBody(ordinary,C.step,'running',0,()=>{});
 expect(ordinary.x).toBe(500);expect(ordinary.burst).toBe(0);
});
it('real relay discharge preserves the already earned relocation index',()=>{
 const w=new World();Object.assign(w,{scheduled:[]});const b=w.spawn('sniper',220,360),node=w.spawn('conduit',220,560);
 b.pattern='relocate';b.x=360;b.sentryVolleys=1;b.timer=2.4;
 w.bullets.push({id:99999,x:node.x,y:node.y,px:node.x,py:node.y,vx:0,vy:0,damage:100,age:0,active:true,hostile:false});
 w.step(C.step,68);w.drainEffects();expect(w.conduitBursts).toBe(1);expect(b.empRemaining).toBe(1.5);expect(b.sentryVolleys).toBe(1);
 const x=b.x;w.step(C.step,68);expect(b.x).toBeLessThan(x);
});
it('shared forecasting reserves both the original and relocated real bullet crossings',()=>{
 const w=new World();w.phase='boss';const b=w.spawn('sniper',220,360);b.pattern='relocate';
 const original=JSON.stringify(w.bodies),forecast=dangerTimeline(w.bodies,[],9,{phase:'boss'});expect(JSON.stringify(w.bodies)).toBe(original);
 const lanes=new Set<number>();
 for(let f=0;f<540;f++){
  w.step(C.step,68);w.drainEffects();
  for(const bullet of w.bullets.filter(b=>b.hostile))if(Math.min(bullet.py,bullet.y)-31<=C.playerY&&Math.max(bullet.py,bullet.y)+31>=C.playerY){
   expect(forecast[Math.floor(f/6)].some(([lo,hi])=>lo<=bullet.x-27&&hi>=bullet.x+27)).toBe(true);lanes.add(bullet.x);
  }
 }
 expect([...lanes].sort((a,b)=>a-b)).toEqual([220,360]);expect(w.player.hp).toBe(3);
});
