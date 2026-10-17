import{World}from'../src/core/world';import{C}from'../src/core/config';import{timeline,Random}from'../src/core/director';import{battleIndex}from'../src/core/battle-plan';import{pursuitWaves}from'../src/core/pursuit-waves';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World;
const seconds=Number(process.env.RESERVE_SECONDS??1200);
function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical'){
 const w=new Runtime(1337,1,'scatter'),born=new Map<number,any>(),accepted=new Map<number,any>(),seenShots=new Set<number>(),chapters=new Map<number,any>(),bounced=new Set<number>();
 let aim=360;
 const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind in C.enemies){const seed=w.round===1?1337:1337+w.round*719,mirror=w.round>1&&new Random(seed).next()>.5;const slots=pursuitWaves(w.round,mirror,battleIndex(w.round));const slot=slots.find(s=>s.kind===b.kind&&Math.abs(s.at-w.roundTime)<.04&&Math.abs(s.x-b.x)<.01&&Math.abs((s.dropY??0)-b.y)<.01);born.set(b.id,{b,round:w.round,at:w.time,slot:slot?{...slot}:null});}return b;})as World['spawn'];
 for(let f=0;f<seconds*60&&w.player.hp>0;f++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
  if(f%6===0)aim=progressionTarget(w);
  w.step(C.step,aim);w.drainEffects();
  for(const b of w.bodies)if(b.active&&born.has(b.id)&&!accepted.has(b.id))accepted.set(b.id,{...born.get(b.id),shots:0,firstShot:null,minX:b.x,maxX:b.x,lived:0});
  for(const b of w.bullets)if(b.hostile){const src=accepted.get(b.sourceId!);if(!seenShots.has(b.id)){seenShots.add(b.id);if(src){src.shots++;src.firstShot??=w.time;}}if(b.bankRemaining===0&&src?.slot)bounced.add(b.id);}
  for(const s of accepted.values())if(s.b.active){s.lived+=C.step;s.minX=Math.min(s.minX,s.b.x);s.maxX=Math.max(s.maxX,s.b.x);}
  if(w.phase==='running'){let c=chapters.get(w.round);if(!c){c={round:w.round,seconds:0,enemySeconds:0,empty:0,shots:0,maxEnemies:0};chapters.set(w.round,c);}const n=w.bodies.filter(b=>b.active&&b.kind in C.enemies).length;c.seconds+=C.step;c.enemySeconds+=n*C.step;c.empty+=Number(n===0)*C.step;c.maxEnemies=Math.max(c.maxEnemies,n);}
 }
 const reserves=[...accepted.values()].filter(s=>s.slot).map(s=>({round:s.round,at:s.at,slot:s.slot,pattern:s.b.pattern,kind:s.b.kind,hp:s.b.hp,maxHp:s.b.maxHp,shots:s.shots,firstShot:s.firstShot,lived:s.lived,minX:s.minX,maxX:s.maxX}));
 return{route,time:w.time,hp:w.player.hp,damage:w.damageTaken,gates:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount,bouncedReserveShots:bounced.size,reserves,chapters:[...chapters.values()].map(c=>({...c,average:c.enemySeconds/c.seconds}))};
}
const runs=[];for(const route of['ballistic','electric','optical']as const){const before=run(Old,route),after=run(World,route);runs.push({before,after});console.log(JSON.stringify({route,before:{hp:before.hp,wins:before.bossWins},after:{hp:after.hp,time:after.time,wins:after.bossWins,bounces:after.bouncedReserveShots,peak:after.peakBullets},guns:after.reserves.filter(s=>s.kind!=='drone'&&s.shots).map(s=>({r:s.round,k:s.kind,p:s.pattern,shots:s.shots}))}));}
writeFileSync('build/qa/Stage-222/normal-audit.json',JSON.stringify({method:'One seed, three earned builds and old/new 1200s streams; omniscient safe controls, no World injection. Reserve identification by original spawn slot; late admissions may be absent from that subset. Not human difficulty or device performance.',seconds,runs},null,2));
