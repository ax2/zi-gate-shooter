import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('records real enemy emissions and normal growth through three 300-second routes',()=>{
 const results=[];
 for(const primary of ['ballistic','electric','optical']){
  const w=new World(1337);let target=360;const seen=new Set(),shots=[];
  for(let f=0;f<300*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   if(w.contractReward)w.claimContractReward('energy');
   const a=w.build.available(w.buildPoints),route=a.includes(primary)?primary:a[0];if(route)w.chooseBuild(route);
   if(f%6===0)target=progressionTarget(w);w.step(C.step,target);w.drainEffects();
   for(const b of w.bullets)if(b.hostile&&!seen.has(b.id)){
    seen.add(b.id);shots.push({time:w.time,round:w.round,y:b.py,vx:b.vx,vy:b.vy,flight:(C.playerY-b.py)/b.vy});
   }
  }
  const rounds=[...new Set(shots.map(s=>s.round))].map(round=>{const flight=shots.filter(s=>s.round===round).map(s=>s.flight).sort((a,b)=>a-b);return {round,shots:flight.length,minFlight:flight[0],medianFlight:flight[Math.floor(flight.length/2)]};});
  results.push({primary,time:w.time,round:w.round,hp:w.player.hp,kills:w.kills,refits:w.refitsClaimed,weapons:w.activeWeapons,rounds,shots,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
  expect(w.time).toBeCloseTo(300);expect(w.player.hp).toBeGreaterThan(0);expect(shots.some(s=>s.round>1)).toBe(true);
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-projectile-pressure`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(results,null,2));
},60000);
