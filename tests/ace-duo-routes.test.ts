import {it,expect} from 'vitest';import {writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {safeRoute} from '../src/core/reachability';
it.each(['fan','needle'] as const)('keeps isolated %s survivor revenge avoidable with initial reaction at three chapter scales',role=>{
 const rows=[];
 for(const round of [1,2,4])for(const start of [68,360,652]){
  // Explicit phase model, not normal earned progression: begin at one survivor with no friendly damage.
  const w=new World(1337,round);w.player.x=start;
  const p=w.spawn('pickup',start,C.playerY,2);p.weaponKind='pulse';w.step(C.step,start);
  expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);w.step(C.step,start);
  const targets=w.bodies.filter(b=>b.aceRole),b=targets.find(b=>b.aceRole===role)!;expect(b).toBeDefined();
  for(const other of targets)if(other!==b){other.hp=0;other.active=false;}
  w.bullets=w.bullets.filter(b=>b.hostile);for(const kind of w.activeWeapons)(w as any).fireTimers.set(kind,Infinity);(w as any).laserTimer=Infinity;
  b.aceRagePending=true;b.timer=.2;let path:number[]=[],at=0,shots=0;
  for(let f=0;f<30*60;f++){
   if(f%30===0){const route=safeRoute(w.player.x,w.bodies,w.bullets,6,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0?.45:0});expect(route,`${role} r${round} x${start} t${w.time}`).not.toBeNull();path=route??[];at=f;}
   w.step(C.step,path[Math.floor((f-at)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);expect(w.player.hp).toBe(3);shots=b.aceRageShots??0;
  }
  expect(shots).toBeGreaterThan(0);expect(w.kills).toBe(0);expect(w.contractReward).toBeUndefined();
  rows.push({role,round,start,time:w.time,hp:w.player.hp,damage:w.damageTaken,kills:w.kills,rageShots:shots,contract:w.contract?.status,peakBullets:w.peakBullets});
 }
 writeFileSync(`build/qa/Stage-213/routes-${role}.json`,JSON.stringify(rows,null,2));
},120000);
