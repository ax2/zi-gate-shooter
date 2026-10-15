import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
it('compares exact branch tradeoffs and reaches both through normal five-minute growth',()=>{
 const comparisons=[],runs=[];
 for(const branch of ['spread','capacitor']){
  for(const encounter of ['heavy','cluster']){
   const w=new World();w.growth.mastery=2;w.chooseBuild('electric');w.chooseBuild('electric',branch);
   const targets=(encounter==='heavy'?[360]:[360,460,560,650]).map(x=>{const b=w.spawn(encounter==='heavy'?'armor':'drone',x,600);b.hp=b.maxHp=encounter==='heavy'?1000:12;b.speed=0;b.timer=999;return b;});
   for(let i=0;i<(encounter==='heavy'?9:1);i++){w.bullets=[{id:999999,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:encounter==='heavy'?10:48,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:w.profileFor('arc').chainHops}];w.step(C.step,68);w.drainEffects();}
   comparisons.push({branch,encounter,damage:targets.map(b=>b.maxHp-b.hp),kills:targets.filter(b=>!b.active).length,bursts:w.capacitorBursts});
  }
  const w=new World(1337);let target=360,chosenAt;
  for(let frame=0;frame<300*60&&w.phase!=='dead';frame++){
   const available=w.build.available(w.growth.mastery??0);const route=available.includes('electric')&&w.build.ranks.electric<3?'electric':available.find(r=>w.build.ranks[r]<3)??available[0];
   if(route){w.chooseBuild(route,route==='electric'&&w.build.ranks.electric===1?branch:undefined);if(w.build.electricBranch&&!chosenAt)chosenAt=w.time;}
   if(frame%6===0)target=progressionTarget(w);w.step(C.step,target);w.drainEffects();
  }
  runs.push({branch,selected:w.build.electricBranch,chosenAt,time:w.time,hp:w.player.hp,round:w.round,capacitorBursts:w.capacitorBursts,kills:w.kills,mastery:w.growth.mastery,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-electric-branches`;mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/branches.json`,JSON.stringify({comparisons,runs},null,2));
 const damage=(b,e)=>comparisons.find(r=>r.branch===b&&r.encounter===e).damage;
 expect(damage('capacitor','heavy')[0]).toBeGreaterThan(damage('spread','heavy')[0]);expect(damage('spread','cluster')[3]).toBeGreaterThan(0);expect(damage('capacitor','cluster')[3]).toBe(0);
 expect(comparisons.find(r=>r.branch==='spread'&&r.encounter==='cluster').kills).toBe(4);expect(comparisons.find(r=>r.branch==='capacitor'&&r.encounter==='cluster').kills).toBe(3);
 for(const run of runs){expect(run.time).toBeCloseTo(300);expect(run.selected).toBe(run.branch);expect(run.chosenAt).toBeLessThan(150);expect(run.peakBullets).toBeLessThanOrEqual(C.limits.bullets+C.limits.hostile);}
 expect(runs.find(r=>r.branch==='capacitor').capacitorBursts).toBeGreaterThan(0);
},60000);
