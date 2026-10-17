import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{observedNoFireRoute}from'../tests/helpers/observed-route-driver';import{writeFileSync}from'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World,seconds=Number(process.env.LAYERS_SECONDS??300);
if(process.env.LAYERS_ROUTES==='1'){
 const results=[];for(const round of[1,2,3,4,5,6,8,9,12,15])for(const plan of[0,1,2]as const)for(const start of[68,360,652]){
  const r=observedNoFireRoute(round,plan,start,round%2?1337:9001);results.push(r);if(r.failureTime!==null||r.hp!==3)console.log(JSON.stringify(r));
 }writeFileSync('build/qa/Stage-228/routes.json',JSON.stringify(results,null,2));console.log(JSON.stringify({routes:results.length,failed:results.filter(r=>r.failureTime!==null||r.hp!==3||r.phase!=='boss-entry').length}));
}else{
 function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical'){
  const w=new Runtime(1337,1,'scatter'),chapters=new Map<number,any>(),births=new Map<number,any>(),seen=new Set<number>();let aim=360;
  const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind in C.enemies)births.set(b.id,{round:w.round,at:w.roundTime,kind:b.kind,x:b.x,y:b.y,b,shots:0});return b;})as World['spawn'];
  for(let f=0;f<seconds*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
   if(f%6===0)aim=progressionTarget(w);w.step(C.step,aim);w.drainEffects();
   for(const b of w.bodies)if(b.active&&births.has(b.id))births.get(b.id).accepted=true;
   for(const b of w.bullets)if(b.hostile&&!seen.has(b.id)){seen.add(b.id);const s=births.get(b.sourceId!);if(s)s.shots++;}
   if(w.phase==='running'){
    let c=chapters.get(w.round);if(!c){c={round:w.round,windows:[]};chapters.set(w.round,c);}
    for(const [i,start]of[10,21,46].entries())if(w.roundTime>=start&&w.roundTime<start+5){const slot=c.windows[i]??={start,seconds:0,enemySeconds:0,empty:0,peak:0};const n=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>=240&&b.y<=1024).length;slot.seconds+=C.step;slot.enemySeconds+=n*C.step;slot.empty+=Number(n===0)*C.step;slot.peak=Math.max(slot.peak,n);}
   }
  }
  return{route,time:w.time,hp:w.player.hp,damage:w.damageTaken,round:w.round,gates:w.gatesTaken,pickups:w.pickups,kills:w.kills,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,chapters:[...chapters.values()],sources:[...births.values()].filter(s=>s.accepted&&s.y>=300&&((s.round-1)%3===2?s.at>=10&&s.at<14:s.at>=21&&s.at<25)).map(({b,...s})=>({...s,pattern:b.pattern,maxHp:b.maxHp}))};
 }
 const runs=[];for(const route of['ballistic','electric','optical']as const){const before=run(Old,route),after=run(World,route);runs.push({before,after});console.log(JSON.stringify({route,before:{hp:before.hp,gates:before.gates,pickups:before.pickups,wins:before.bossWins},after:{hp:after.hp,gates:after.gates,pickups:after.pickups,wins:after.bossWins},shots:after.sources.filter(s=>s.kind==='armor'||s.kind==='sniper').map(s=>({round:s.round,pattern:s.pattern,shots:s.shots}))}));}
 writeFileSync(`build/qa/Stage-228/normal-${seconds}.json`,JSON.stringify({seconds,seed:1337,method:'Normally earned progression, same omniscient zero-reaction safe operator. Virtual60Hz not FPS or human difficulty. Window counts include all actual enemies; emitter sources require observed admission, shots counted from real projectiles. No World injection.',runs},null,2));
}
