import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';
const auditSeconds=Number(process.env.BOSS_TEAM_SECONDS??600);
const basePath='./baseline.mjs',Old=(await import(basePath)).World;
function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical',policy:'boss'|'escort'|'hold'){
 const w=new Runtime(1337,1,'scatter'),sources=new Map<number,any>(),battles:any[]=[];let current:any,aim=360;
 const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind in C.enemies)sources.set(b.id,{b,round:w.round,at:w.time,shots:0});return b;})as World['spawn'];

 const seenShots=new Set<number>();
 for(let f=0;f<auditSeconds*60&&w.player.hp>0;f++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
  if(f%6===0){const escort=policy==='escort'&&w.phase==='boss'?w.activeEscorts.sort((a,b)=>b.y-a.y)[0]:undefined;aim=policy==='hold'&&w.round>1&&w.phase==='boss'?360:progressionTarget(w,undefined,escort?.x);}
  w.step(C.step,aim);w.drainEffects();
  if(w.phase==='boss'&&!current){const boss=w.bodies.find(b=>b.active&&b.kind==='boss')!;current={round:w.round,start:w.time,boss,initialHP:boss.maxHp,damageStart:w.damageTaken,shieldFrames:0,shots:0,escortShots:0,escorts:new Map(),minX:w.player.x,maxX:w.player.x};}
  if(current){current.shieldFrames+=Number(w.bossShieldActive());current.minX=Math.min(current.minX,w.player.x);current.maxX=Math.max(current.maxX,w.player.x);for(const b of w.activeEscorts)if(!current.escorts.has(b.id))current.escorts.set(b.id,b);}
  for(const shot of w.bullets)if(shot.hostile&&!seenShots.has(shot.id)){seenShots.add(shot.id);const src=sources.get(shot.sourceId!);if(src)src.shots++;if(current){current.shots++;if(src?.b.escort)current.escortShots++;}}
  if(current&&w.phase!=='boss'){battles.push({round:current.round,initialHP:current.initialHP,duration:w.time-current.start,phase:w.phase,damage:w.damageTaken-current.damageStart,shieldSeconds:current.shieldFrames/60,shots:current.shots,escortShots:current.escortShots,minX:current.minX,maxX:current.maxX,escorts:[...current.escorts.values()].map((b:any)=>({id:b.id,kind:b.kind,pattern:b.pattern,lockX:b.lockX,hp:b.hp,maxHp:b.maxHp,age:b.age,shots:sources.get(b.id)?.shots??0}))});current=null;}
 }
 return{route,policy,time:w.time,hp:w.player.hp,damage:w.damageTaken,gates:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,escortKills:w.escortKills,escortSpawns:w.escortSpawns,tacticalWins:w.tacticalWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount,battles};
}
const runs=[];for(const route of['ballistic','electric','optical']as const)for(const policy of(auditSeconds>600?['boss']:['boss','escort','hold'])as ('boss'|'escort'|'hold')[]){const before=run(Old,route,policy),after=run(World,route,policy);runs.push({before,after});console.log(JSON.stringify({route,policy,oldHP:before.hp,newHP:after.hp,oldWins:before.bossWins,newWins:after.bossWins,battles:after.battles.slice(0,3)}));}writeFileSync(`build/qa/Stage-220/boss-audit${auditSeconds===600?'':'-'+auditSeconds}.json`,JSON.stringify({method:'Normal earned builds and inputs; virtual 60Hz, no World injection; safe aiming and deliberately idle boss policies, not human difficulty or performance',runs},null,2));
