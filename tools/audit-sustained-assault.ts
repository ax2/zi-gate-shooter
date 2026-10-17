import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World;
const seconds=Number(process.env.ASSAULT_SECONDS??300),baselineOnly=process.env.ASSAULT_BASELINE_ONLY==='1';
function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical'){
 const w=new Runtime(1337,1,'scatter'),chapters=new Map<number,any>(),sources=new Map<number,any>(),seenShots=new Set<number>();let aim=360,emptyStart:number|null=null,quietStart:number|null=null,lastRound=1;
 for(let f=0;f<seconds*60&&w.player.hp>0;f++){
  if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
  if(f%6===0)aim=progressionTarget(w);w.step(C.step,aim);const effects=w.drainEffects();
  if(w.round!==lastRound){emptyStart=null;quietStart=null;lastRound=w.round;}
  let c=chapters.get(w.round);if(!c){c={round:w.round,seconds:0,enemySeconds:0,emptySeconds:0,quietSeconds:0,maxEnemies:0,emptySpans:[],quietSpans:[],closingAt:null,closingUnits:[],bossEntryAt:null};chapters.set(w.round,c);}
  if(effects.some(e=>e.type==='drop-wave'&&e.text?.startsWith('终线'))){c.closingAt=w.roundTime;for(const b of w.bodies.filter(b=>b.active&&b.kind in C.enemies)){const s={id:b.id,kind:b.kind,pattern:b.pattern,maxHp:b.maxHp,shots:[],firstX:b.x,minX:b.x,maxX:b.x};c.closingUnits.push(s);sources.set(b.id,s);}}
  for(const b of w.bodies){const s=sources.get(b.id);if(s){s.minX=Math.min(s.minX,b.x);s.maxX=Math.max(s.maxX,b.x);}}
  for(const b of w.bullets)if(b.hostile&&!seenShots.has(b.id)){seenShots.add(b.id);sources.get(b.sourceId!)?.shots.push({time:w.time,roundTime:w.roundTime,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}
  if(w.phase==='boss-entry')c.bossEntryAt??=w.roundTime;
  if(w.phase==='running'){
   const n=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>=0&&b.y<=1280).length;c.seconds+=C.step;c.enemySeconds+=n*C.step;c.maxEnemies=Math.max(c.maxEnemies,n);
   if(n===0){emptyStart??=w.roundTime;c.emptySeconds+=C.step;}
   else if(emptyStart!==null){if(w.roundTime-emptyStart>.5)c.emptySpans.push({from:emptyStart,to:w.roundTime,seconds:w.roundTime-emptyStart});emptyStart=null;}
   const quiet=!w.bodies.some(b=>b.active);
   if(quiet){quietStart??=w.roundTime;c.quietSeconds+=C.step;}
   else if(quietStart!==null){if(w.roundTime-quietStart>.25)c.quietSpans.push({from:quietStart,to:w.roundTime,seconds:w.roundTime-quietStart});quietStart=null;}
  }else if(emptyStart!==null){if(w.roundTime-emptyStart>.5)c.emptySpans.push({from:emptyStart,to:w.roundTime,seconds:w.roundTime-emptyStart});emptyStart=null;}
  if(w.phase!=='running'&&quietStart!==null){if(w.roundTime-quietStart>.25)c.quietSpans.push({from:quietStart,to:w.roundTime,seconds:w.roundTime-quietStart});quietStart=null;}
 }
 return{route,time:w.time,hp:w.player.hp,damage:w.damageTaken,round:w.round,gates:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,fallbacks:w.fallbackCount,chapters:[...chapters.values()].filter(c=>c.seconds>0).map(c=>({...c,average:c.enemySeconds/c.seconds}))};
}
const runs=[];for(const route of['ballistic','electric','optical']as const){const before=run(Old,route),after=baselineOnly?null:run(World,route);runs.push({before,after});console.log(JSON.stringify({route,before:{hp:before.hp,wins:before.bossWins},after:after?{hp:after.hp,wins:after.bossWins,closing:after.chapters.filter(c=>c.closingAt!==null).length}:null}));}
writeFileSync(`build/qa/Stage-223/gap-audit-${baselineOnly?'before':seconds}.json`,JSON.stringify({seconds,method:'Earned builds and normal inputs, one seed 1337; omniscient safety control, virtual 60Hz; visible active enemies y0..1280 only. Not human experience or performance.',runs},null,2));
