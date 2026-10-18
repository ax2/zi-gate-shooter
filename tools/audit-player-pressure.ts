import{World}from'../src/core/world';import{C,clamp}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{mkdirSync,writeFileSync}from'node:fs';
const route=(process.argv[2]??'optical')as'ballistic'|'electric'|'optical';if(!['ballistic','electric','optical'].includes(route))throw Error('Unknown route');
const dir='build/qa/Stage-253';mkdirSync(dir,{recursive:true});const rows=[];
for(const policy of['safe','hold-after-boss','delay450','delay900']as const){
 const w=new World(1337,1,'scatter',0),events:any[]=[],queue:{at:number;x:number}[]=[];let aim=360,holdAt:number|undefined,peakEnemies=0;
 for(let f=0;f<600*60&&w.player.hp>0;f++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const options=w.build.available(w.buildPoints),r=options.includes(route)?route:options[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
  if(policy==='hold-after-boss'&&w.round>=2&&holdAt===undefined){holdAt=w.time;aim=360;}
  if(f%6===0&&holdAt===undefined){const target=progressionTarget(w),lag=policy==='delay450'?.45:policy==='delay900'?.9:0;queue.push({at:w.time+lag,x:clamp(target,C.minX,C.maxX)});}
  while(queue.length&&queue[0].at<=w.time+1e-9){if(holdAt===undefined)aim=queue[0].x;queue.shift();}
  const damage=w.damageTaken,bosses=w.bossWins;w.step(C.step,aim);w.drainEffects();peakEnemies=Math.max(peakEnemies,w.bodies.filter(b=>b.active&&b.kind in C.enemies).length);
  if(w.damageTaken>damage)events.push({time:w.time,round:w.round,hp:w.player.hp,cause:w.lastDamageCause});if(w.bossWins>bosses)events.push({time:w.time,round:w.round,bossVictory:true,hp:w.player.hp});
 }
 const row={route,policy,time:w.time,round:w.round,phase:w.phase,hp:w.player.hp,damage:w.damageTaken,bosses:w.bossWins,score:w.score,pickups:w.pickups,gates:w.gatesTaken,holdAt,peakEnemies,events};rows.push(row);writeFileSync(`${dir}/${route}-${policy}.json`,JSON.stringify(row,null,2));console.log(JSON.stringify(row));
}
writeFileSync(`${dir}/${route}-summary.json`,JSON.stringify({method:'Normal earned World inputs. Delay queues omniscient movement commands; it is a control-latency diagnostic, not a human-skill model. Held center starts after first boss. No World injection.',rows},null,2));
