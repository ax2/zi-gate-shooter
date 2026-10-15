import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('compares the two optical branches on controlled targets and normal five-minute progression',()=>{
 const comparisons=[],runs=[];
 for(const branch of ['burn','relay']){
  for(const encounter of ['heavy','cluster']){
   const w=new World();w.growth.mastery=2;w.chooseBuild('optical');w.chooseBuild('optical',branch);
   const targets=[360,480].map(x=>{const b=w.spawn('armor',x,600);b.speed=0;b.timer=999;b.hp=b.maxHp=encounter==='heavy'?1000:12;return b;});
   const initial=targets.map(b=>b.hp);
   for(let frame=0;frame<55;frame++){w.bullets=[];w.step(C.step,360);w.drainEffects();}
   comparisons.push({branch,encounter,damage:targets.map((b,i)=>initial[i]-b.hp),kills:targets.filter(b=>!b.active).length,burnHits:w.burnHits,relayHits:w.relayHits});
  }
  const w=new World(1337);let target=360;const neighborSamples=[];
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   if(w.build.available(w.growth.mastery??0).includes('optical'))w.chooseBuild('optical',w.build.ranks.optical===1?branch:undefined);
   if(frame%6===0)target=progressionTarget(w);
   const before=w.bodies.filter(b=>b.active).map(b=>({kind:b.kind,x:b.x,y:b.y,id:b.id}));
   w.step(C.step,target);const events=w.drainEffects();
   if(branch==='relay'&&w.build.opticalBranch==='relay'){
    const beam=events.findIndex(e=>e.type==='laser'&&!e.prism);
    if(beam>=0){
     const hit=events.slice(0,beam).find(e=>e.type==='impact'||e.type==='impact-gate');
     const primary=hit&&before.find(b=>Math.abs(b.x-hit.x)<.01&&Math.abs(b.y-hit.y)<.01);
     if(primary&&primary.kind in C.enemies){
      const distances=before.filter(b=>b.id!==primary.id&&b.kind in C.enemies&&b.y>=C.playerShotTop&&b.y<=C.playerY).map(b=>Math.hypot(b.x-primary.x,b.y-primary.y));
      if(neighborSamples.length<50)neighborSamples.push({time:w.time,kind:primary.kind,nearest:distances.length?Math.min(...distances):null});
     }
    }
   }
  }
  runs.push({branch,selected:w.build.opticalBranch,neighborSamples,time:w.time,hp:w.player.hp,round:w.round,burnHits:w.burnHits,relayHits:w.relayHits,kills:w.kills,mastery:w.growth.mastery,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-optical-branches`;
 mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/branches.json`,JSON.stringify({comparisons,runs},null,2));
 const heavyBurn=comparisons.find(r=>r.branch==='burn'&&r.encounter==='heavy'),heavyRelay=comparisons.find(r=>r.branch==='relay'&&r.encounter==='heavy');
 expect(heavyBurn.damage[0]).toBeGreaterThan(heavyRelay.damage[0]);
 expect(comparisons.find(r=>r.branch==='burn'&&r.encounter==='cluster').kills).toBe(1);
 expect(comparisons.find(r=>r.branch==='relay'&&r.encounter==='cluster').kills).toBe(2);
 for(const run of runs){expect(run.time).toBeCloseTo(300);expect(run[run.branch==='burn'?'burnHits':'relayHits']).toBeGreaterThan(0);expect(run.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
},60000);
