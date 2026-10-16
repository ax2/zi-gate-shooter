import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
class TracedWorld extends World {
 elites=[];
 spawn(...args){const b=super.spawn(...args);if(b.kind==='elite')this.elites.push({body:b,spawnTime:this.time,round:this.round,pattern:b.pattern,seen:0,warningAt:null,shots:[]});return b;}
}
it('records actual elite warnings, lifespan and muzzle-matched emissions in normal growth',()=>{
 const runs=[];
 for(const route of ['ballistic','electric','optical']){
  const w=new TracedWorld(1337);let target=360;
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r);
   if(frame%6===0)target=progressionTarget(w);w.step(C.step,target);w.drainEffects();
   for(const e of w.elites){const b=e.body;if(b.active){e.seen++;if(b.warning>0&&e.warningAt===null)e.warningAt=w.time;}
    for(const shot of w.bullets){const dx=shot.px-b.x,dy=shot.py-b.y-b.height/2;
     const muzzle=b.pattern==='intercept'?(Math.abs(Math.abs(dx)-52)<1e-6&&Math.abs(dy)<1e-6||Math.abs(dx)<1e-6&&[0,45,90].some(v=>Math.abs(dy+v)<1e-6)):Math.abs(dx)<1e-6&&Math.abs(dy)<1e-6;
     if(shot.hostile&&shot.age<=C.step+1e-8&&muzzle)e.shots.push({time:w.time,x:shot.px,y:shot.py,vx:shot.vx,vy:shot.vy});
    }
   }
  }
  runs.push({route,time:w.time,hp:w.player.hp,interceptorBreaks:w.interceptorBreaks,elites:w.elites.filter(e=>e.seen||e.body.hp<=0).map(e=>({id:e.body.id,round:e.round,spawnTime:e.spawnTime,kind:e.body.pattern??'single',hp:e.body.maxHp,aliveAtEnd:e.body.active,age:e.body.age,frames:e.seen,warningAt:e.warningAt,wingShots:e.body.interceptWingShots??0,coreShots:e.body.interceptCoreShots??0,shots:e.shots}))});
  expect(w.time).toBeCloseTo(600);expect(w.player.hp).toBeGreaterThan(0);
 }
 mkdirSync('build/qa/Stage-161',{recursive:true});writeFileSync('build/qa/Stage-161/elite-normal.json',JSON.stringify(runs,null,2));
 expect(runs.filter(r=>r.elites.some(e=>e.wingShots>0))).toHaveLength(2);expect(runs.some(r=>r.interceptorBreaks>0)).toBe(true);
},60000);
