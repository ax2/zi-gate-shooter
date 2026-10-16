import {build} from 'esbuild';import {writeFileSync} from 'node:fs';import {World,C} from '../build/qa/Stage-189/baseline.mjs';
const out=await build({stdin:{contents:`export {progressionTarget} from './tests/helpers/progression-driver';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});const {progressionTarget}=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const runs=[];for(const route of ['optical','ballistic','electric']){
 const w=new World(1337,1,route==='electric'?'arc':route==='ballistic'?'pierce':'scatter'),groups=new Map(),shots=new Set(),passed=new Set();let aim=360;
 for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r){const branch=w.build.ranks[r]===1?r==='optical'?'relay':r==='electric'?'seeker':'penetrator':r==='optical'&&w.canRefinePhoton()?'photon-focus':r==='electric'&&w.canRefineMagnetic()?'field-link':r==='ballistic'&&w.canRefineFracture()?'fracture-quick':undefined;w.chooseBuild(r,branch);}
  if(frame%6===0)aim=progressionTarget(w);w.step(C.step,aim);w.drainEffects();
  if(w.round%3===0&&w.roundTime>=55.5&&w.roundTime<56.5)for(const b of w.bodies)if(b.active&&b.age<=C.step+1e-9&&['armor','drone'].includes(b.kind)){if(!groups.has(w.round))groups.set(w.round,[]);groups.get(w.round).push({body:b,admitted:w.time,shots:0,passed:0});}
  for(const b of w.bullets)if(b.hostile){const g=[...groups.values()].flat().find(g=>g.body.id===b.sourceId);if(!g)continue;if(!shots.has(b.id)){shots.add(b.id);g.shots++;}if(b.py<C.playerY-50&&b.y>=C.playerY-50&&!passed.has(b.id)){passed.add(b.id);g.passed++;}}
 }
 runs.push({route,time:w.time,hp:w.player.hp,round:w.round,groups:[...groups.entries()].map(([round,list])=>({round,units:list.map(({body,...g})=>({...g,kind:body.kind,x:body.x,y:body.y,age:body.age,hp:body.hp,pattern:body.pattern??null}))}))});
}
writeFileSync('docs/stages/Stage-189/baseline-pressure-modern.json',JSON.stringify(runs,null,2));console.log(JSON.stringify(runs,null,2));
