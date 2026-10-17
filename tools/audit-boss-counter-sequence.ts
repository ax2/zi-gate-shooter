import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';import assert from'node:assert/strict';
const path='./baseline.mjs',Old=(await import(path)).World,seconds=Number(process.env.COUNTER_SECONDS??300);
function input(w:World,route:'ballistic'|'electric'|'optical'){
 if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];
 if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':w.build.ranks[r]===1?'burn':undefined);
}
const serialize=(x:unknown)=>JSON.stringify(x,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v);
if(process.env.COUNTER_MODE==='legacy'){
 const results=[];for(const route of['ballistic','electric','optical']as const){const a=new Old(1337,1,'scatter'),b=new World(1337,1,'scatter');let aim=360;
  for(let f=0;f<90*60;f++){input(a,route);input(b,route);if(f%6===0)aim=progressionTarget(a);a.step(C.step,aim);b.step(C.step,aim);assert.equal(serialize(b.drainEffects()),serialize(a.drainEffects()),`${route} effects frame${f}`);assert.equal(serialize(b),serialize(a),`${route} World frame${f}`);}results.push({route,frames:5400,hp:b.player.hp,equal:true});
 }writeFileSync('build/qa/Stage-230/legacy.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}else{
 function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical',policy:'boss'|'escort'){
  const w=new Runtime(1337,1,'scatter'),battles:any[]=[],bosses=new Map<number,any>(),seen=new Set<number>(),meta=new Map<number,any>(),arrived=new Set<number>();let aim=360;
  const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind==='boss')bosses.set(b.id,{b,round:w.round,variant:b.bossVariant,begin:null,end:null,half:null,shots:[],arrivals:[],hp:b.maxHp});return b;})as World['spawn'];
  for(let f=0;f<seconds*60&&w.player.hp>0;f++){
   input(w,route);if(f%6===0){const escort=policy==='escort'&&w.phase==='boss'?w.activeEscorts.sort((a,b)=>b.y-a.y)[0]:undefined;aim=progressionTarget(w,undefined,escort?.x);}w.step(C.step,aim);w.drainEffects();
   for(const row of bosses.values()){if(row.begin===null&&w.phase==='boss'&&row.b.active)row.begin=w.time;if(row.half===null&&row.b.counterfire)row.half=w.time;if(row.end===null&&!row.b.active)row.end=w.time;}
   for(const s of w.bullets)if(s.hostile){
    if(!seen.has(s.id)){seen.add(s.id);const row=bosses.get(s.sourceId!);if(row){const shot={id:s.id,time:w.time,x:s.x,y:s.y,vx:s.vx,vy:s.vy,attack:row.b.attack,beat:row.b.counterShotBeat??0,counter:row.b.attack===4};row.shots.push(shot);meta.set(s.id,{row,shot});}}
    const m=meta.get(s.id);if(m?.shot.counter&&!arrived.has(s.id)&&Math.min(s.py,s.y)-31<=C.playerY&&Math.max(s.py,s.y)+31>=C.playerY){arrived.add(s.id);m.row.arrivals.push({id:s.id,time:w.time,x:s.x,beat:m.shot.beat});}
   }
  }
  for(const r of bosses.values())battles.push({round:r.round,variant:r.b.bossVariant,hp:r.hp,begin:r.begin,end:r.end,half:r.half,arrivals:r.arrivals,alive:r.b.active,remainingHP:r.b.hp,completedCounters:r.b.counterVolleys??0,acceptedCounterShots:r.b.counterShots??null,shots:r.shots});
  return{route,policy,time:w.time,hp:w.player.hp,gates:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,deferrals:w.attackDeferrals,battles};
 }
 const rows=[];for(const route of['ballistic','electric','optical']as const)for(const policy of(seconds>300?['boss']:['boss','escort'])as ('boss'|'escort')[]){const before=run(Old,route,policy),after=run(World,route,policy);rows.push({before,after});console.log(JSON.stringify({route,policy,before:{hp:before.hp,wins:before.bossWins,gates:before.gates,pickups:before.pickups},after:{hp:after.hp,wins:after.bossWins,gates:after.gates,pickups:after.pickups},counters:after.battles.slice(0,3).map(b=>({round:b.round,half:b.half,completed:b.completedCounters,accepted:b.acceptedCounterShots,observed:b.shots.filter((s:any)=>s.counter).length,arrived:b.arrivals.length,beats:[...new Set(b.shots.filter((s:any)=>s.counter).map((s:any)=>s.beat))]}))}));}
 writeFileSync(`build/qa/Stage-230/normal-${seconds}.json`,JSON.stringify({seed:1337,rows,limits:'Normally earned progression, legal lens fusion/choices, fixed seed and same safe zero-reaction omniscient input. Observed projectiles survive until frame inspection; accepted new counter counts may include last-frame shots cleared on victory. Partial/killed-before-fire phrases retained. Virtual60Hz not FPS or human difficulty.'},null,2));
}
